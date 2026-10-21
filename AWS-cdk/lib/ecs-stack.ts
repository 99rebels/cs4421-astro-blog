import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';

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
        environment: { PORT: String(port) },
        logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'astro', logGroup }),
      },
    });

    // The load balancer only sends traffic to tasks that say they're ready to serve pages.
    service.targetGroup.configureHealthCheck({
      path: '/api/health/ready',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: service.loadBalancer.loadBalancerDnsName,
    });
  }
}
