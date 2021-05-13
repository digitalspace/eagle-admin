export const handler = async () => {
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from lambdaEdge AWS Lambda Function!'),
  };
  return response;
};
