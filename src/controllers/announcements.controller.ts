import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Announcement from '../models/Announcement';
import AuditLog from '../models/AuditLog';
import { getIO } from '../config/socket';

const getAnnouncementQuery = (id: string) => {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id };
};

/**
 * Get all announcements (filtered by audience/class)
 */
export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const { targetAudience, classId, limit = 50, offset = 0 } = req.query;
    const query: any = {};

    if (targetAudience) query.targetAudience = targetAudience;
    if (classId) query.$or = [{ targetAudience: 'all' }, { targetClassIds: classId }];
    
    // Admins can pass ?status=archived to see archived; everyone else only sees active
    const statusFilter = (req.query.status as string) || 'active';
    query.status = statusFilter;

    const announcements = await Announcement.find(query)
      .sort({ publishedAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await Announcement.countDocuments(query);
    res.json({ announcements, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

/**
 * Get a single announcement by ID
 */
export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findOne(getAnnouncementQuery(id));
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
};

/**
 * Create a new announcement
 */
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content, targetAudience, targetClassIds, attachments, image } = req.body;
    if (!title || !content || !targetAudience) {
      res.status(400).json({ error: 'Title, content, and targetAudience are required' });
      return;
    }
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const announcement = new Announcement({
      id: uuidv4(),
      title,
      content,
      authorId: (user as any)._id.toString(),
      authorRole: user.role,
      targetAudience,
      targetClassIds: targetClassIds || [],
      attachments: attachments || [],
      publishedAt: new Date(),
      image,
    });
    await announcement.save();
    
    // Emit real-time update
    const io = getIO();
    if (io) {
      io.emit('new_announcement', announcement);
    }
    
    await AuditLog.create({
      id: uuidv4(),
      adminId: (user as any)._id.toString(),
      action: 'CREATE_ANNOUNCEMENT',
      targetType: 'announcement',
      targetId: announcement.id,
      details: `Created announcement "${title}"`,
    });
    
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

/**
 * Update an announcement
 */
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const announcement = await Announcement.findOneAndUpdate(
      getAnnouncementQuery(id),
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    const user = req.user;
    if (user) {
      await AuditLog.create({
        id: uuidv4(),
        adminId: (user as any)._id.toString(),
        action: 'UPDATE_ANNOUNCEMENT',
        targetType: 'announcement',
        targetId: announcement.id || announcement._id.toString(),
        details: `Updated announcement "${announcement.title}"`,
      });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findOneAndDelete(getAnnouncementQuery(id));
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    const user = req.user;
    if (user) {
      await AuditLog.create({
        id: uuidv4(),
        adminId: (user as any)._id.toString(),
        action: 'DELETE_ANNOUNCEMENT',
        targetType: 'announcement',
        targetId: id,
        details: `Deleted announcement "${announcement.title}"`,
      });
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

/**
 * Archive an announcement (soft-delete)
 */
export const archiveAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findOneAndUpdate(
      getAnnouncementQuery(id),
      { $set: { status: 'archived' } },
      { new: true }
    );
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    const user = req.user;
    if (user) {
      await AuditLog.create({
        id: uuidv4(),
        adminId: (user as any)._id.toString(),
        action: 'ARCHIVE_ANNOUNCEMENT',
        targetType: 'announcement',
        targetId: announcement.id || announcement._id.toString(),
        details: `Archived announcement "${announcement.title}"`,
      });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive announcement' });
  }
};

/**
 * Restore an archived announcement
 */
export const restoreAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findOneAndUpdate(
      getAnnouncementQuery(id),
      { $set: { status: 'active' } },
      { new: true }
    );
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    const user = req.user;
    if (user) {
      await AuditLog.create({
        id: uuidv4(),
        adminId: (user as any)._id.toString(),
        action: 'UPDATE_ANNOUNCEMENT',
        targetType: 'announcement',
        targetId: announcement.id || announcement._id.toString(),
        details: `Restored announcement "${announcement.title}"`,
      });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore announcement' });
  }
};
