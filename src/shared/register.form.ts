import * as z from 'zod';

export const registerFormSchema = z.object({
  name: z.string().min(1, { message: 'Destroyer name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
  confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormValue = z.infer<typeof registerFormSchema>;

