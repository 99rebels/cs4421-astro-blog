import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { AwsCdkStack } from '../lib/aws-cdk-stack';

// CloudFront runs the function file as a plain script that defines a global `handler`,
// so the file can't export anything. Running its text the same way means these tests
// exercise exactly the code that gets deployed.
const code = readFileSync(path.join(__dirname, '../functions/index-rewrite.js'), 'utf8');
const handler = new Function(`${code}\nreturn handler;`)();

async function rewrite(uri: string): Promise<string> {
  const request = await handler({ request: { uri } });
  return request.uri;
}

describe('index-rewrite CloudFront Function', () => {
  test('adds index.html to the root URL', async () => {
    expect(await rewrite('/')).toBe('/index.html');
  });

  test('adds index.html to a folder URL that ends in a slash', async () => {
    expect(await rewrite('/about/')).toBe('/about/index.html');
    expect(await rewrite('/blog/my-post/')).toBe('/blog/my-post/index.html');
  });

  test('adds /index.html to a folder URL without a trailing slash', async () => {
    expect(await rewrite('/about')).toBe('/about/index.html');
  });

  test('leaves a URL that names a file unchanged', async () => {
    expect(await rewrite('/favicon.ico')).toBe('/favicon.ico');
    expect(await rewrite('/_astro/index.BkUj5w0E.css')).toBe('/_astro/index.BkUj5w0E.css');
  });
});

describe('AwsCdkStack', () => {
  test('runs the index rewrite on every viewer request', () => {
    const template = Template.fromStack(new AwsCdkStack(new cdk.App(), 'TestStack'));

    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          FunctionAssociations: [Match.objectLike({ EventType: 'viewer-request' })],
        },
      },
    });
  });
});
