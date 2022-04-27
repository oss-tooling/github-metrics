const { OSDashboardInstance } = require('./instance')

const username = process.env.OPENSEARCH_USER;
const password = process.env.OPENSEARCH_PASSWORD;

(async() => {
  const instance = new OSDashboardInstance({ username, password });
  await instance.connect();
  await instance.exportObjects();
})()


