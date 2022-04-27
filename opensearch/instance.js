const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const defaultNode = 'https://localhost:5601';
const node = process.env.OPENSEARCH_HOST || defaultNode;
const security_tenant=process.env.OPENSEARCH_TENANT || 'global';
const authCookiePattern = /(^|;)security_authentication=(.*?);/g;


function OSDashboardInstance(params) {
  if (!(params.username && params.password)) {
    throw new Error('Invalid inputs, ensure username and password are provided.');
  }
  this.sanitizeUrl = params.sanitizeUrl == undefined ? true : params.sanitizeUrl;
  this.username = params.username;
  this.password = params.password;
  this.tenant = params.tenant || security_tenant;

  this.client = axios.create({
    baseURL: `${node}/_dashboards`,
    headers: {
      'osd-xsrf': true,
      'Content-Type': 'application/json',
    },
  });
  
  const self = this;
  this.client.interceptors.response.use(function (response) {  
    // include the session auth cookie in following requests
    const authCookie = response.headers['set-cookie'][0].match(authCookiePattern)[0];
  
    if (authCookie) {
      self.client.defaults.headers.common['Cookie'] = authCookie;
    }
  
    return response;
    }, function (error) {
      return Promise.reject(error);
    });

}

OSDashboardInstance.prototype.connect = async function () {
  const login = await this.client.post(`/auth/login?security_tenant=${this.tenant}`, { username: this.username, password: this.password });
  return login;
}

OSDashboardInstance.prototype.exportObjects = async function () {
  const objectTypes = [
    'config',
    'index-pattern',
    'visualization',
    'url',
    'search',
    'dashboard',
    'query'
  ]

  if (this.sanitizeUrl) {
    console.log(`Sanitize URL is enabled, replacing instances of "${node}" with "${defaultNode}" in exported objects.`);
  }

  for (const objectType of objectTypes) {
    let typeDir = `${objectType}s`;

    const objects = await this.client.post(`/api/saved_objects/_export`, {
      includeReferencesDeep: true,
      type: objectType
    });

    if (objectType === 'search') {
      typeDir = 'searches';
    } else if (objectType === 'query') {
      typeDir = 'queries';
    }

    let payload = (typeof objects.data === 'string') ? objects.data : JSON.stringify(objects.data);

    if (this.sanitizeUrl) {
      payload = payload.replaceAll(node, defaultNode);
    }

    console.debug(`Exporting ${payload.split('\n').length} ${objectType} objects.`);
    const output = path.join(__dirname, 'objects', `${typeDir}.ndjson`);
    await fs.writeFile(output, payload, 'utf8');
  }
}

  module.exports = {
    OSDashboardInstance,
  }