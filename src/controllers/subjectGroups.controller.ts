import { Request, Response } from 'express';
import SubjectGroup from '../models/SubjectGroup';

/**
 * Get all subject groups
 */
export const getAllSubjectGroups = async (req: Request, res: Response) => {
  try {
    const groups = await SubjectGroup.find().sort({ name: 1 });
    res.json({ data: groups });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subject groups' });
  }
};

/**
 * Create a new subject group
 */
export const createSubjectGroup = async (req: Request, res: Response) => {
  try {
    const { name, subjects } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const existingGroup = await SubjectGroup.findOne({ name });
    if (existingGroup) {
      res.status(409).json({ error: 'Subject group with this name already exists' });
      return;
    }

    const group = new SubjectGroup({ name, subjects: subjects || [] });
    await group.save();
    
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subject group' });
  }
};

/**
 * Update a subject group
 */
export const updateSubjectGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subjects } = req.body;

    const group = await SubjectGroup.findByIdAndUpdate(
      id,
      { $set: { name, subjects } },
      { new: true, runValidators: true }
    );

    if (!group) {
      res.status(404).json({ error: 'Subject group not found' });
      return;
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subject group' });
  }
};

/**
 * Delete a subject group
 */
export const deleteSubjectGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await SubjectGroup.findByIdAndDelete(id);
    
    if (!group) {
      res.status(404).json({ error: 'Subject group not found' });
      return;
    }
    
    res.json({ message: 'Subject group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subject group' });
  }
};
