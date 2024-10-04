"use server"

import { sql } from "@vercel/postgres"
import { log } from "console"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid'], {
        errorMap: () => ({ message: 'Status is required' }),
    }),
    date: z.string(),
})
    .omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {


    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    const { customerId, amount, status } = FormSchema.parse(rawFormData);

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    
    try {
        await sql`
    INSERT INTO invoices (customer_id, amount, status, date) 
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        return {
            message: "Database Error: Failed to create Invoice.",
        }
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {

    const { customerId, amount, status } = FormSchema.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    try {
        await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
    `;
    } catch (error) {
        return {
            message: "Database Error: Failed to update Invoice.",
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {

    try {   
        await sql`DELETE FROM invoices WHERE id = ${id}`;
    } catch (error) {
        return {
            message: "Database Error: Failed to delete Invoice.",
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}


