const crypto = require('crypto');
const express = require('express')

const {Client} = require('@opensearch-project/opensearch')

const port = 3000
const app = express()

app.use(express.json())

const protocol = process.env.PROTOCOL
const host = process.env.HOST
const auth = process.env.AUTH

const client = new Client({
    node: protocol + '://' + auth + '@' + host,
})

app.post('/github/webhooks', async (req, res) => {
    try {
        if (!validateWebhook(req)) {
            res.status(400).send('Invalid signature')
            return
        }
        const index_name = req.headers['x-github-event']
        const settings = {
            'settings': {
                'index': {
                    'mapping.total_fields.limit': 2500,
                    'number_of_shards': 3,
                    'number_of_replicas': 3,
                    'routing.allocation.disable_allocation': false
                }
            }
        }

        try {
            const exists = await client.indices.exists({
                index: index_name
            })
            if (exists.body === false) {
                await client.indices.create({
                    index: index_name,
                    body: settings
                })
            }
        } catch (err) {
            console.error(`Error creating index ${index_name}: ${new Buffer(JSON.stringify(err)).toString('base64')}`)
        }

        await client.index({
            id: req.headers['x-github-delivery'],
            index: index_name,
            body: req.body,
            refresh: true
        })

        console.log(`Added document with id ${req.headers['x-github-delivery']} to index ${index_name}`)
        res.status(200).send()
    } catch (err) {
        console.error(`Error indexing document: ${new Buffer(JSON.stringify(err)).toString('base64')}`)
        if (err.status) {
            res.status(err.status).send({
                message: err.message
            })
        } else {
            res.status(547).send({
                message: err.message
            })
        }
    }
})

function validateWebhook(req) {
    const signature = req.headers["x-hub-signature-256"]
    const secret = process.env.SECRET
    const digest = crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex")
    const expectedSignature = `sha256=${digest}`
    return signature === expectedSignature
}

app.listen(port, () => console.log(`Server listening on ${port}!`))
