'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateEventData } from '@/lib/api';

const eventSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  date: z.string().min(1, 'La date est requise'),
  location: z.string().min(1, 'Le lieu est requis'),
  capacity: z.number().min(1, 'La capacité doit être au moins 1'),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (data: CreateEventData) => Promise<void>;
  submitLabel: string;
}

export function EventForm({ defaultValues, onSubmit, submitLabel }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaultValues || {},
  });

  const handleFormSubmit = async (data: EventFormValues) => {
    try {
      await onSubmit({
        title: data.title,
        description: data.description,
        date: data.date,
        location: data.location,
        capacity: data.capacity,
      });
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Une erreur est survenue' });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-xl">
      {errors.root && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
          {errors.root.message}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" {...register('title')} className={errors.title ? 'border-red-500' : ''} />
        {errors.title && <p className="text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className={`w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-gray-900 ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'}`}
        />
        {errors.description && <p className="text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Date et heure</Label>
        <Input
          id="date"
          type="datetime-local"
          {...register('date')}
          className={errors.date ? 'border-red-500' : ''}
        />
        {errors.date && <p className="text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input id="location" {...register('location')} className={errors.location ? 'border-red-500' : ''} />
        {errors.location && <p className="text-sm text-red-600 dark:text-red-400">{errors.location.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacité (nombre de places)</Label>
        <Input
          id="capacity"
          type="number"
          min={1}
          {...register('capacity', { valueAsNumber: true })}
          className={errors.capacity ? 'border-red-500' : ''}
        />
        {errors.capacity && <p className="text-sm text-red-600 dark:text-red-400">{errors.capacity.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : submitLabel}
      </Button>
    </form>
  );
}
