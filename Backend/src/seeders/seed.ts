import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { EventsService } from '../events/events.service';
import { ReservationsService } from '../reservations/reservations.service';
import { getModelToken } from '@nestjs/mongoose';
import { Event, EventDocument } from '../events/event.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EventStatus } from '../events/event.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const usersService = app.get(UsersService);
  const eventsService = app.get(EventsService);
  const reservationsService = app.get(ReservationsService);
  const eventModel = app.get<Model<EventDocument>>(getModelToken(Event.name));

  console.log('🌱 Début du seeding...');

  try {
    // Créer un compte Admin
    const adminEmail = 'admin@evenza.com';
    const adminPassword = 'admin123';
    
    let admin = await usersService.findByEmail(adminEmail);
    if (!admin) {
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      admin = await usersService.create(adminEmail, hashedAdminPassword, 'ADMIN');
      console.log('✅ Compte Admin créé:', adminEmail);
    } else {
      console.log('ℹ️  Compte Admin existe déjà:', adminEmail);
    }

    // Créer un compte Participant
    const participantEmail = 'participant@evenza.com';
    const participantPassword = 'participant123';
    
    let participant = await usersService.findByEmail(participantEmail);
    if (!participant) {
      const hashedParticipantPassword = await bcrypt.hash(participantPassword, 10);
      participant = await usersService.create(participantEmail, hashedParticipantPassword, 'PARTICIPANT');
      console.log('✅ Compte Participant créé:', participantEmail);
    } else {
      console.log('ℹ️  Compte Participant existe déjà:', participantEmail);
    }

    // Créer des événements
    const events = [
      {
        title: 'Formation NestJS Avancé',
        description: 'Formation approfondie sur NestJS, les modules, les guards et les interceptors.',
        date: '2026-02-15T14:00:00',
        location: 'Salle A - Centre de Formation',
        capacity: 20,
        status: EventStatus.PUBLISHED,
      },
      {
        title: 'Atelier React et Next.js',
        description: 'Découvrez React et Next.js pour créer des applications web modernes.',
        date: '2026-02-20T10:00:00',
        location: 'Salle B - Centre de Formation',
        capacity: 15,
        status: EventStatus.PUBLISHED,
      },
      {
        title: 'Conférence sur le DevOps',
        description: 'Introduction au DevOps avec Docker et CI/CD.',
        date: '2026-02-25T16:00:00',
        location: 'Amphithéâtre - Centre de Formation',
        capacity: 50,
        status: EventStatus.PUBLISHED,
      },
      {
        title: 'Événement en brouillon',
        description: 'Cet événement est en brouillon et ne sera pas visible publiquement.',
        date: '2026-03-01T14:00:00',
        location: 'Salle C - Centre de Formation',
        capacity: 10,
        status: EventStatus.DRAFT,
      },
    ];

    const createdEvents: EventDocument[] = [];
    for (const eventData of events) {
      // Vérifier si l'événement existe déjà par titre
      const existingEvent = await eventModel.findOne({ title: eventData.title }).exec();
      if (!existingEvent) {
        const event = await eventsService.create(eventData);
        createdEvents.push(event);
        console.log(`✅ Événement créé: ${event.title}`);
      } else {
        createdEvents.push(existingEvent);
        console.log(`ℹ️  Événement existe déjà: ${eventData.title}`);
      }
    }

    // Créer des réservations pour le participant
    if (participant && createdEvents.length > 0) {
      const publishedEvents = createdEvents.filter(e => e.status === EventStatus.PUBLISHED);
      
      if (publishedEvents.length > 0) {
        // Réservation 1 : En attente
        try {
          const reservation1 = await reservationsService.create(
            { eventId: publishedEvents[0]._id.toString() },
            participant._id.toString()
          );
          console.log(`✅ Réservation créée (PENDING) pour: ${publishedEvents[0].title}`);
          
          // Réservation 2 : Confirmée (si deuxième événement disponible)
          if (publishedEvents.length > 1) {
            try {
              const reservation2 = await reservationsService.create(
                { eventId: publishedEvents[1]._id.toString() },
                participant._id.toString()
              );
              // Confirmer la réservation
              await reservationsService.confirm(reservation2._id.toString());
              console.log(`✅ Réservation créée (CONFIRMED) pour: ${publishedEvents[1].title}`);
            } catch (error: any) {
              if (!error.message.includes('déjà une réservation')) {
                console.log(`ℹ️  Réservation existe déjà pour: ${publishedEvents[1].title}`);
              }
            }
          }

          // Réservation 3 : Refusée (si troisième événement disponible)
          if (publishedEvents.length > 2) {
            try {
              const reservation3 = await reservationsService.create(
                { eventId: publishedEvents[2]._id.toString() },
                participant._id.toString()
              );
              // Refuser la réservation
              await reservationsService.refuse(reservation3._id.toString());
              console.log(`✅ Réservation créée (REFUSED) pour: ${publishedEvents[2].title}`);
            } catch (error: any) {
              if (!error.message.includes('déjà une réservation')) {
                console.log(`ℹ️  Réservation existe déjà pour: ${publishedEvents[2].title}`);
              }
            }
          }
        } catch (error: any) {
          if (!error.message.includes('déjà une réservation')) {
            console.log(`ℹ️  Réservation existe déjà pour: ${publishedEvents[0].title}`);
          }
        }
      }
    }

    console.log('\n📋 Résumé du seeding:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Comptes créés:');
    console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
    console.log(`   Participant: ${participantEmail} / ${participantPassword}`);
    console.log('\n📅 Événements créés:', createdEvents.length);
    console.log('🎫 Réservations créées avec différents statuts');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seeding terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
