import 'dotenv/config';
import { z } from 'zod';

const addressRegex = /(^|\b)(0x)?[0-9a-fA-F]{40}(\b|$)/;
const privateKeyRegex = /(^|\b)(0x)?[0-9a-fA-F]{64}(\b|$)/;

const envSchema = z.object({
    // Private key of the wallet used for transactions
    DEPLOYER_PRIVATE_KEY: z
        .string()
        .regex(privateKeyRegex, 'Invalid private key format')
        .optional()
        .or(z.literal('')),

    // DatasetRegistry address (override)
    DATASET_REGISTRY_ADDRESS: z
        .string()
        .regex(addressRegex, 'Invalid Ethereum address format')
        .optional()
        .or(z.literal('')),

    // RPC URL used for network connection
    RPC_URL: z.string().url('RPC_URL must be a valid URL').optional().or(z.literal('')),

    // Mnemonic for deployment or network interaction
    MNEMONIC: z.string().min(1, 'MNEMONIC cannot be empty').optional().or(z.literal('')),

    // Arbiscan API key
    EXPLORER_API_KEY: z.string().optional().or(z.literal('')),

    // Whether to use API V2 verification format
    IS_VERIFICATION_API_V2: z
    .string()
    .optional()
    .default('true')
    .refine((val) => val === 'true' || val === 'false', {
      message: 'IS_VERIFICATION_API_V2 must be "true" or "false"',
    })
    .transform((val) => val === 'true'),
});

export const env = envSchema.parse(process.env);
