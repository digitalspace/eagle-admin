exports.handler = async () => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      debugMode: process.env['debugMode'],
      ENVIRONMENT: process.env['ENVIRONMENT'],
      BANNER_COLOUR: process.env['BANNER_COLOUR'],
      API_LOCATION: process.env['API_LOCATION'],
      API_PATH: process.env['API_PATH'],
      API_PUBLIC_PATH: process.env['API_PUBLIC_PATH'],
      KEYCLOAK_CLIENT_ID: process.env['KEYCLOAK_CLIENT_ID'],
      KEYCLOAK_URL: process.env['KEYCLOAK_URL'],
      KEYCLOAK_REALM: process.env['KEYCLOAK_REALM'],
      KEYCLOAK_ENABLED: process.env['KEYCLOAK_ENABLED']
    }),
  };
  return response;
};
