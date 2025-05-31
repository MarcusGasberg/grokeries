import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form';
import { useQuery, useZero } from "@rocicorp/zero/react";
import { Schema } from 'zero-schema';
import { nanoid } from 'nanoid';

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>{field.state.meta.errors.join(', ')}</em>
      ) : null}
    </>
  )
}

export const Route = createFileRoute('/groceries')({
  component: RouteComponent,
})

function RouteComponent() {
  const z = useZero<Schema>();

  // Build a query for posts with their authors
  const groceryQuery = z.query.groceries.related("author").limit(10);

  const [groceries] = useQuery(groceryQuery);

  const form = useForm({
    defaultValues: {
      name: '',
      quantity: 1
    },
    onSubmit: () => {
      z.mutate.groceries.insert({
        id: nanoid(),
        name: "New Grocery Item2",
        quantity: 1,
      });
    }
  })

  return (
    <div>
      <h1>Grocery List</h1>
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}>

        <form.Field name="name"
          validators={{
            onChange: ({ value }) => value.length === 0 ? 'Required' : undefined
          }}
          children={(field) => {
            return (<>
              <label htmlFor={field.name} />
              <input
                type="text"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Grocery Name"
              />

              <FieldInfo field={field} />
            </>)
          }}
        />

        <form.Field name="quantity"
          validators={{
            onChange: ({ value }) => value <= 0 ? 'Must be greater than 0' : undefined
          }}
          children={(field) => {
            return (<>
              <label htmlFor={field.name} />
              <input
                type="number"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                placeholder="Quantity"
              />

              <FieldInfo field={field} />
            </>)
          }}
        />


        <button
          disabled={!form.state.isValid}
          type="submit"
        >Add</button>
      </form>

      <pre>{JSON.stringify(groceries, null, 2)}</pre>
    </div>
  )
}
