'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateEventData } from '@/lib/api';

const eventSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères').max(1000, 'La description ne peut pas dépasser 1000 caractères'),
  date: z.string().min(1, 'La date est requise').refine((date) => {
    if (!date) return false;
    const selectedDate = new Date(date);
    const now = new Date();
    return selectedDate > now;
  }, 'La date doit être dans le futur'),
  location: z.string().min(3, 'Le lieu doit contenir au moins 3 caractères').max(200, 'Le lieu ne peut pas dépasser 200 caractères'),
  capacity: z.number().min(1, 'La capacité doit être au moins 1').max(10000, 'La capacité ne peut pas dépasser 10000'),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (data: CreateEventData) => Promise<void>;
  submitLabel: string;
  isSubmitting?: boolean;
}

export function EventForm({ defaultValues, onSubmit, submitLabel, isSubmitting: externalIsSubmitting }: EventFormProps) {
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
        capacity: typeof data.capacity === 'number' ? data.capacity : Number(data.capacity) || 1,
      });
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Une erreur est survenue' });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 w-full max-w-xl">
      {errors.root && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
          {errors.root.message}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input 
          id="title" 
          {...register('title')} 
          placeholder="Ex: Formation NestJS Avancé"
          className={errors.title ? 'border-red-500' : ''} 
        />
        {errors.title && <p className="text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400">Entre 3 et 100 caractères</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          rows={5}
          {...register('description')}
          placeholder="Décrivez votre événement en détail..."
          className={`w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-gray-900 ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'}`}
        />
        {errors.description && <p className="text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400">Entre 10 et 1000 caractères</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date et heure *</Label>
          <Input
            id="date"
            type="datetime-local"
            {...register('date')}
            className={errors.date ? 'border-red-500' : ''}
          />
          {errors.date && <p className="text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400">Doit être dans le futur</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacité (nombre de places) *</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            max={10000}
            {...register('capacity', { valueAsNumber: true })}
            placeholder="Ex: 50"
            className={errors.capacity ? 'border-red-500' : ''}
          />
          {errors.capacity && <p className="text-sm text-red-600 dark:text-red-400">{errors.capacity.message}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400">Entre 1 et 10000 places</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Lieu *</Label>
        <Input 
          id="location" 
          {...register('location')} 
          placeholder="Ex: Salle A - Centre de Formation"
          className={errors.location ? 'border-red-500' : ''} 
        />
        {errors.location && <p className="text-sm text-red-600 dark:text-red-400">{errors.location.message}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400">Adresse complète ou nom du lieu</p>
      </div>
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting || externalIsSubmitting} className="min-w-[150px]">
          {isSubmitting || externalIsSubmitting ? 'Création en cours...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/events">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
