'use client';

import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import { createPet, getPet, updatePet, Pet } from '@/lib/pets';
import { useRouter } from 'next/navigation';

interface PetFormProps {
  petId?: string | null; // when provided, loads pet for edit
}

export default function PetForm({ petId }: PetFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<Partial<Pet>>({
    type: 'dog',
    name: '',
    breed: '',
    weightKg: null,
    activityLevel: 'Medium',
    ageYears: null,
    gender: 'Male',
    allergies: [],
    preferredDiet: '',
    healthNotes: '',
    vaccinationStatus: '',
    avatarDataUrl: null,
  });

  useEffect(() => {
    if (petId) {
      (async () => {
        const pet = await getPet(petId);
        if (pet) setForm(pet);
      })();
    }
  }, [petId]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name || form.name.trim() === '') e.name = 'Name is required';
    if (form.weightKg !== null && form.weightKg !== undefined && Number(form.weightKg) <= 0) e.weightKg = 'Weight must be positive';
    if (form.ageYears !== null && form.ageYears !== undefined && Number(form.ageYears) < 0) e.ageYears = 'Age must be 0 or greater';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (petId) {
        await updatePet(petId, form as Partial<Pet>);
      } else {
        const created = await createPet(form as Partial<Pet>);
        // navigate to edit/view after creation
        router.push(`/dashboard/pets/${created.id}`);
      }
      // on success, navigate back to pets list
      if (petId) router.push('/dashboard/pets');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-900 mb-2">Photo</label>
          <ImageUpload value={form.avatarDataUrl || null} onChange={(v) => handleChange('avatarDataUrl', v)} />
        </div>

        <div className="sm:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Name</label>
            <input value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : ''}`} />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Breed</label>
              <input value={form.breed || ''} onChange={(e) => handleChange('breed', e.target.value)} className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Weight (kg)</label>
              <input value={form.weightKg ?? ''} onChange={(e) => handleChange('weightKg', e.target.value ? Number(e.target.value) : null)} type="number" min="0" step="0.1" className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.weightKg ? 'border-red-500' : ''}`} />
              {errors.weightKg && <p className="mt-1 text-sm text-red-600">{errors.weightKg}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Activity Level</label>
              <select value={form.activityLevel} onChange={(e) => handleChange('activityLevel', e.target.value)} className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Age (years)</label>
              <input value={form.ageYears ?? ''} onChange={(e) => handleChange('ageYears', e.target.value ? Number(e.target.value) : null)} type="number" min="0" className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.ageYears ? 'border-red-500' : ''}`} />
              {errors.ageYears && <p className="mt-1 text-sm text-red-600">{errors.ageYears}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Gender</label>
              <select value={form.gender || 'Male'} onChange={(e) => handleChange('gender', e.target.value)} className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Vaccination Status</label>
              <input value={form.vaccinationStatus || ''} onChange={(e) => handleChange('vaccinationStatus', e.target.value)} className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Allergies (comma separated)</label>
            <input value={(form.allergies || []).join(', ')} onChange={(e) => handleChange('allergies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Preferred Diet</label>
            <input value={form.preferredDiet || ''} onChange={(e) => handleChange('preferredDiet', e.target.value)} className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Health Notes</label>
            <textarea value={form.healthNotes || ''} onChange={(e) => handleChange('healthNotes', e.target.value)} rows={4} className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : petId ? 'Save Changes' : 'Create Pet'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard/pets')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </div>
    </form>
  );
}
