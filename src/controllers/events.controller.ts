import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Event from '../models/Event';
import { getIO } from '../config/socket';

const getEventQuery = (id: string) => {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id };
};

/**
 * Get all events
 */
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const { targetAudience, upcoming } = req.query;
    const query: any = {};
    if (targetAudience) query.targetAudience = targetAudience;
    if (upcoming === 'true') {
      query.date = { $gte: new Date().toISOString().split('T')[0] };
    }
    // Filter archived events (admins can request ?status=archived)
    const statusFilter = (req.query.status as string) || 'active';
    query.status = statusFilter;
    const events = await Event.find(query).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

/**
 * Get a single event by ID
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.findOne(getEventQuery(id));
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

/**
 * Create a new event
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, date, time, location, targetAudience, targetClassIds, image } = req.body;
    if (!title || !description || !date || !time || !location || !targetAudience) {
      res.status(400).json({ error: 'title, description, date, time, location, and targetAudience are required' });
      return;
    }
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const event = new Event({
      id: uuidv4(),
      title,
      description,
      date,
      time,
      location,
      image,
      createdBy: (user as any)._id.toString(),
      rsvps: [],
      targetAudience,
      targetClassIds: targetClassIds || [],
    });
    await event.save();
    
    // Emit real-time update
    const io = getIO();
    if (io) {
      io.emit('new_event', event);
    }
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
};

/**
 * Update an event
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.rsvps; // Prevent overwriting RSVPs via update
    const event = await Event.findOneAndUpdate(
      getEventQuery(id),
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.findOneAndDelete(getEventQuery(id));
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

/**
 * Archive an event (soft-delete)
 */
export const archiveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.findOneAndUpdate(
      getEventQuery(id),
      { $set: { status: 'archived' } },
      { new: true }
    );
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive event' });
  }
};

/**
 * Restore an archived event
 */
export const restoreEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.findOneAndUpdate(
      getEventQuery(id),
      { $set: { status: 'active' } },
      { new: true }
    );
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore event' });
  }
};

/**
 * RSVP to an event
 */
export const rsvpEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'attending' | 'not_attending'
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!['attending', 'not_attending'].includes(status)) {
      res.status(400).json({ error: 'Status must be "attending" or "not_attending"' });
      return;
    }

    const userId = (user as any)._id.toString();
    const event = await Event.findOne(getEventQuery(id));
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Remove existing RSVP from this user and add new one
    event.rsvps = event.rsvps.filter((r) => r.userId !== userId);
    event.rsvps.push({ userId, status });
    await event.save();
    res.json(event);
  } catch (error) {
    console.error('RSVP Error:', error);
    res.status(500).json({ error: 'Failed to update RSVP' });
  }
};
