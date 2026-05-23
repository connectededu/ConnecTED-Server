import { Request, Response } from 'express';
import Program from '../models/Program';

export const getAllPrograms = async (req: Request, res: Response) => {
  try {
    const programs = await Program.find().sort({ name: 1 });
    res.json({ data: programs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
};

export const getProgramById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json(program);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch program' });
  }
};

export const createProgram = async (req: Request, res: Response) => {
  try {
    const { name, subjects } = req.body;
    
    const existing = await Program.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'Program with this name already exists' });
    }

    const program = new Program({ name, subjects: subjects || [] });
    await program.save();
    res.status(201).json(program);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create program' });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subjects } = req.body;

    const program = await Program.findByIdAndUpdate(
      id,
      { name, subjects },
      { new: true }
    );

    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json(program);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update program' });
  }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const program = await Program.findByIdAndDelete(id);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete program' });
  }
};

export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const { q, limit = 5 } = req.query;
    
    // Aggregate to get all unique subjects
    const programs = await Program.find({}, 'subjects');
    let allSubjects = new Set<string>();
    
    programs.forEach(p => {
      p.subjects.forEach(s => allSubjects.add(s));
    });
    
    let subjectsArray = Array.from(allSubjects);
    
    // Search if query is provided
    if (q && typeof q === 'string') {
      const lowerQ = q.toLowerCase();
      subjectsArray = subjectsArray.filter(s => s.toLowerCase().includes(lowerQ));
    }
    
    // Sort alphabetically and limit
    subjectsArray.sort();
    const paginated = subjectsArray.slice(0, Number(limit));
    
    res.json({ data: paginated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};
