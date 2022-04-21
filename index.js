const crypto = require('crypto')
const express = require('express')

const {Client} = require('@opensearch-project/opensearch')

const app = express()

const AUTH = process.env.GH_TELEMETRY_AUTH
const HOST = process.env.GH_TELEMETRY_HOST
const PORT = process.env.GH_TELEMETRY_PORT || 3000
const PROTOCOL = process.env.GH_TELEMETRY_PROTOCOL

const FIELD_LIMIT = process.env.GH_TELEMETRY_FIELD_LIMIT || 2500
const SHARDS = process.env.GH_TELEMETRY_SHARDS || 3
const REPLICAS = process.env.GH_TELEMETRY_REPLICAS || 3
const SECRET = process.env.GH_TELEMETRY_SECRET

const client = new Client({
    node: `${PROTOCOL}://${AUTH}@${HOST}`
})

const indices = [
    'branch_protection_rule',
    'check_run',
    'check_suite',
    'code_scanning_alert',
    'commit_comment',
    'create',
    'delete',
    'deploy_key',
    'deployment',
    'deployment_status',
    'discussion',
    'discussion_comment',
    'fork',
    'github_app_authorization',
    'gollum',
    'installation',
    'installation_repositories',
    'issue_comment',
    'issues',
    'label',
    'marketplace_purchase',
    'member',
    'membership',
    'meta',
    'milestone',
    'organization',
    'org_block',
    'package',
    'page_build',
    'ping',
    'project',
    'project_card',
    'project_column',
    'public',
    'pull_request',
    'pull_request_review',
    'pull_request_review_comment',
    'pull_request_review_thread',
    'push',
    'release',
    'repository_dispatch',
    'repository',
    'repository_import',
    'repository_vulnerability_alert',
    'security_advisory',
    'sponsorship',
    'star',
    'status',
    'team',
    'team_add',
    'watch',
    'workflow_dispatch',
    'workflow_job',
    'workflow_run'
]

async function seedIndices() {
    for (const index of indices) {
        const created = await createIndexIfNotExists(index, settings)
        if (!created) {
            process.exit(1)
        }
    }
}

async function createIndexIfNotExists(index) {
    const settings = {
        'settings': {
            'index': {
                'mapping.total_fields.limit': FIELD_LIMIT,
                'number_of_shards': SHARDS,
                'number_of_replicas': REPLICAS
            }
        }
    }

    try {
        const exists = await client.indices.exists({
            index: index
        })
        if (exists.body === false) {
            await client.indices.create({
                index: index,
                body: settings
            })
        }
        return true
    } catch (err) {
        console.error(`Error creating [${index}] index: ${err}`)
        return false
    }
}

app.post('/github/webhooks', async (req, res) => {
    try {
        if (!validateWebhook(req)) {
            res.status(400).send({message: 'Invalid signature'})
            return
        }

        const id = req.headers['x-github-delivery']
        const index = req.headers['x-github-event']

        if (!indices.includes(index)) {
            const created = await createIndexIfNotExists(index)
            if (created) {
                indices.append(index)
            } else {
                res.status(500).send({message: `Error creating [${index}] index`})
                return
            }
        }

        console.log(`[${index}:${id}] Adding document`)
        await client.index({
            id: id,
            index: index,
            body: req.body,
            refresh: true
        })
        console.log(`[${index}:${id}] Document added`)

        res.status(201).send({message: 'Document added'})
    } catch (err) {
        console.error(`Error indexing document: ${err.message}`)
        res.status(err.status || 413).send({message: err.message})
    }
})

function validateWebhook(req) {
    const signature = req.headers['x-hub-signature-256']
    const digest = crypto.createHmac('sha256', SECRET).update(JSON.stringify(req.body)).digest('hex')
    const expectedSignature = `sha256=${digest}`
    return signature === expectedSignature
}

(async function main() {
    await seedIndices()
    app.use(express.json())
    app.listen(PORT, () => {
        console.log(`Listening for webhooks on port ${PORT}`)
    })
})()
