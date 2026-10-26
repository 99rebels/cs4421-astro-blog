import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class EcrStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Fixed name so the deploy pipeline and the docker commands can refer to it directly.
    this.repository = new ecr.Repository(this, 'AstroRepository', {
      repositoryName: 'astro-blog',
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.repository.repositoryUri,
    });
  }
}

export interface EcsStackProps extends cdk.StackProps {
  repository: ecr.IRepository;
}

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const port = 4321;

    // Which image to run is chosen at deploy time, so deploying a new version and rolling
    // back are the same command with a different tag.
    const imageTag = new cdk.CfnParameter(this, 'ImageTag', {
      type: 'String',
      default: 'latest',
      minLength: 1,
      description: 'Tag of the image in the astro-blog ECR repository to run.',
    });

    // Passed in at deploy time so a personal address isn't written into the public repo.
    const alertEmail = new cdk.CfnParameter(this, 'AlertEmail', {
      type: 'String',
      description: 'Email address that receives alarm notifications.',
    });

    const domainName = 'blog.99rebels.com';

    // DNS lives at GoDaddy, not Route 53, so CDK can't add the validation record itself.
    // The deploy waits until the record shown in the ACM console is added at GoDaddy.
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      validation: acm.CertificateValidation.fromDns(),
    });

    // Public subnets only: a NAT gateway would let tasks sit in private subnets, but costs
    // more than the rest of this stack. The security group below keeps the tasks closed.
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [{ name: 'Public', subnetType: ec2.SubnetType.PUBLIC }],
    });

    const logGroup = new logs.LogGroup(this, 'ApplicationLogs', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'AstroService', {
      vpc,
      // Without a NAT gateway, a public IP is the only way the task can reach ECR to pull its image.
      assignPublicIp: true,
      taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      // HTTPS on 443, and plain HTTP on 80 is redirected to it.
      certificate,
      redirectHTTP: true,
      // Never drop below one healthy task during a rollout: start the new one first.
      minHealthyPercent: 100,
      // If the new version never turns healthy, ECS puts the previous one back by itself.
      circuitBreaker: { rollback: true },
      // ECS ignores the Dockerfile HEALTHCHECK, so the liveness check lives here.
      // 127.0.0.1, not localhost: Alpine resolves localhost to IPv6 and the app only
      // listens on IPv4.
      healthCheck: {
        command: ['CMD-SHELL', `wget --no-verbose --tries=1 --spider http://127.0.0.1:${port}/api/health/live || exit 1`],
        timeout: cdk.Duration.seconds(3),
        startPeriod: cdk.Duration.seconds(30),
      },
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(props.repository, imageTag.valueAsString),
        containerPort: port,
        // The image tag is the commit SHA, so /api/health can report which commit is live.
        environment: { PORT: String(port), COMMIT_SHA: imageTag.valueAsString },
        // The Supabase connection string holds the database password, so it's created by
        // hand in SSM Parameter Store and only its name appears here. ECS fetches the
        // value when the container starts and hands it to the app as DATABASE_URL.
        secrets: {
          DATABASE_URL: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(this, 'DatabaseUrl', {
              parameterName: '/astro-blog/database-url',
            }),
          ),
        },
        logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'astro', logGroup }),
      },
    });

    // The load balancer only sends traffic to tasks that say they're ready to serve pages.
    service.targetGroup.configureHealthCheck({
      path: '/api/health/ready',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // The app logs one JSON line per request with a level, and 5xx responses are ERROR
    // (src/utils/log.ts). Counting ERROR lines rather than status codes means any future
    // ERROR log also raises the alarm.
    const errorMetric = new logs.MetricFilter(this, 'ErrorLogFilter', {
      logGroup,
      filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'ERROR'),
      metricNamespace: 'AstroBlog',
      metricName: 'ErrorLogCount',
      metricValue: '1',
    }).metric({ statistic: 'Sum', period: cdk.Duration.minutes(5) });

    const errorAlarm = new cloudwatch.Alarm(this, 'ErrorAlarm', {
      metric: errorMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      // No log lines means no errors, not a problem.
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'The app logged at least one ERROR line in 5 minutes.',
    });

    // AWS emails a confirmation link first; nothing arrives until it's clicked.
    const alertTopic = new sns.Topic(this, 'AlertTopic');
    alertTopic.addSubscription(new snsSubscriptions.EmailSubscription(alertEmail.valueAsString));
    errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: service.loadBalancer.loadBalancerDnsName,
    });
  }
}
