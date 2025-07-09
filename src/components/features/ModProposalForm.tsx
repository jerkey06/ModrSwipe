import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link, Image } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ModProposalFormProps {
  onSubmit: (mod: {
    name: string;
    url?: string;
    description: string;
    image?: string;
  }) => void;
}

export const ModProposalForm: React.FC<ModProposalFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    image: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    setIsSubmitting(true);
    await onSubmit({
      name: formData.name,
      url: formData.url || undefined,
      description: formData.description,
      image: formData.image || undefined,
    });
    
    setFormData({ name: '', url: '', description: '', image: '' });
    setIsSubmitting(false);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Propose a Mod
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Mod Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter mod name"
          required
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Mod URL (optional)"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://curseforge.com/..."
            type="url"
          />
          
          <Input
            label="Image URL (optional)"
            value={formData.image}
            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
            placeholder="https://..."
            type="url"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this mod does..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>
        
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!formData.name || !formData.description || isSubmitting}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Adding...' : 'Add Mod'}
        </Button>
      </form>
    </Card>
  );
};