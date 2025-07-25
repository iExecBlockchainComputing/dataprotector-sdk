import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NETWORK_NAME: z.string().min(1, 'NETWORK_NAME is required').default('bellecour'),

    GRAPHNODE_URL: z
        .string()
        .url('GRAPHNODE_URL must be a valid URL')
        .default('http://localhost:8020'),

    IPFS_URL: z.string().url('IPFS_URL must be a valid URL').default('http://localhost:5001'),

    VERSION_LABEL: z.string().min(1, 'VERSION_LABEL is required').default('bellecour/poco-v5'),

    START_BLOCK: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val >= 0, {
            message: 'START_BLOCK must be a valid non-negative integer',
        })
        .or(z.undefined()),
});

export const env = envSchema.parse(process.env);
