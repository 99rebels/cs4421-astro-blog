import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    });

    // Maps folder URLs like /about/ to /about/index.html, which S3 can't do on its own.
    const indexRewrite = new cloudfront.Function(this, 'IndexRewrite', {
      // Resolved from this file, not from wherever the command is run.
      code: cloudfront.FunctionCode.fromFile({
        filePath: path.join(__dirname, '../functions/index-rewrite.js'),
      }),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
    defaultBehavior: {
      origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
      functionAssociations: [
        { function: indexRewrite, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST },
      ],
    },
    defaultRootObject: 'index.html',
    });

    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset('../dist')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'], // Automatic CloudFront CDN cache invalidation!
    });
  }
}

    // example resource
    // const queue = new sqs.Queue(this, 'AwsCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

