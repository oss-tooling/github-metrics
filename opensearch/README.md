# Opensearch

This directory contains opensearch objects that can be used to aggregate and visualize GitHub webhook data.

**Note:** These configs are a work in progress and are not yet stable and tested.

## Environment Variables
* `OPENSEARCH_USER`: The Opensearch user name.
* `OPENSEARCH_PASSWORD`: The Opensearch password.
* `OPENSEARCH_HOST`: The full path of the opensearch host, defaults to `http://localhost:5601`.
* `OPENSEARCH_TENANT`: The Opensearch tenant name, defaults to `global`.

## Export Data

After setting the appropriate environment variables, export OS objects using the npm script `export-objects`:

```bash
npm run export-objects
```