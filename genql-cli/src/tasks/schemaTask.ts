import { buildASTSchema, assertValidSchema, GraphQLSchema } from 'graphql'
import { ListrTask } from 'listr'
import { Config } from '../config'
import { requireModuleFromPath } from '../helpers/files'
import {
    customFetchSchema,
    fetchSchema,
    SchemaFetcher,
} from '../schema/fetchSchema'
import { loadSchema } from 'graphql-toolkit'

export const schemaTask = (config: Config): ListrTask => {
    if (config.endpoint) {
        const endpoint = config.endpoint
        return {
            title: `fetching schema using ${
                config.useGet ? 'GET' : 'POST'
            } ${endpoint} and headers ${JSON.stringify(config.headers)}`,
            task: async (ctx) => {
                ctx.schema = await fetchSchema({
                    endpoint,
                    usePost: !config.useGet,
                    headers: config.headers,
                })
            },
        }
    } else if (config.schema) {
        const schema = config.schema

        return {
            title: 'loading schema',
            task: async (ctx) => {
                const options = config.options && config.options.schemaBuild
                const document = await loadSchema(schema)
                ctx.schema =
                    document instanceof GraphQLSchema
                        ? document
                        : buildASTSchema(document, options)

                try {
                    assertValidSchema(ctx.schema)
                } catch (e) {
                    if (e.message === 'Query root type must be provided.')
                        return
                    throw e
                }
            },
        }
    } else {
        throw new Error(
            'either `endpoint`, `fetcher` or `schema` must be defined in the config',
        )
    }
}
