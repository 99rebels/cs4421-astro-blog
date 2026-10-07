// Runs in CloudFront on every request, before it reaches S3. S3 has no idea that a
// folder URL like /about/ means /about/index.html, and CloudFront's defaultRootObject
// only covers the bare root URL, so without this every page but the homepage fails.
// Based on AWS's "add index.html to request URLs" example for the cloudfront-js-2.0 runtime.
async function handler(event) {
  const request = event.request;
  const uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!uri.includes('.')) {
    // No file extension, so treat it as a folder that's missing its trailing slash.
    request.uri += '/index.html';
  }

  return request;
}
