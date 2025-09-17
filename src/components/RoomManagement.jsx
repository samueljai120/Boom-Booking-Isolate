import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import CustomSelect from './ui/CustomSelect';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Settings as SettingsIcon,
  Users,
  Tag,
  DollarSign,
  Palette,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const RoomManagement = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const queryClient = useQueryClient();

  // Fetch rooms
  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsAPI.getAll(),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['room-categories'],
    queryFn: () => roomsAPI.getCategories(),
  });

  const rooms = roomsData?.data || [];
  const categories = categoriesData?.data || [];

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    if (filterStatus !== 'all' && room.status !== filterStatus) return false;
    if (filterCategory !== 'all' && room.category !== filterCategory) return false;
    return true;
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: (data) => roomsAPI.create(data),
    onSuccess: (resp) => {
      // Invalidate queries to refetch the updated room list
      queryClient.invalidateQueries(['rooms']);
      queryClient.invalidateQueries(['room-categories']);
      toast.success('Room created successfully');
      setShowForm(false);
      setSelectedRoom(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create room');
    },
  });

  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }) => roomsAPI.update(id, data),
    onSuccess: (resp) => {
      // Invalidate queries to refetch the updated room list
      queryClient.invalidateQueries(['rooms']);
      queryClient.invalidateQueries(['room-categories']);
      toast.success('Room updated successfully');
      setShowForm(false);
      setSelectedRoom(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update room');
    },
  });

  // Delete room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: (id) => roomsAPI.delete(id),
    onSuccess: (resp, variables) => {
      // Invalidate queries to refetch the updated room list
      queryClient.invalidateQueries(['rooms']);
      queryClient.invalidateQueries(['room-categories']);
      toast.success('Room deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete room');
    },
  });

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedRoom(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleDelete = (roomId) => {
    if (window.confirm('Are you sure you want to deactivate this room? This will make it unavailable for new bookings.')) {
      deleteRoomMutation.mutate(roomId);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: <CheckCircle className="w-4 h-4" />,
      inactive: <EyeOff className="w-4 h-4" />,
      maintenance: <Clock className="w-4 h-4" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  const getTypeColor = (type) => {
    const colors = {
      medium: '#3B82F6',
      large: '#10B981',
      party: '#F59E0B'
    };
    return colors[type] || '#3B82F6';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading rooms...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Management</h2>
          <p className="text-gray-600">Manage room details, categories, and availability</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Room</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <CustomSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'maintenance', label: 'Maintenance' }
                ]}
                className="min-w-32"
                placeholder="All"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <CustomSelect
                value={filterCategory}
                onChange={setFilterCategory}
                options={[
                  { value: 'all', label: 'All' },
                  ...categories.map(category => ({ value: category, label: category }))
                ]}
                className="min-w-32"
                placeholder="All"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms List (vertical) */}
      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 overflow-hidden">
        {filteredRooms.map(room => (
          <div key={room._id || room.id} className="flex items-start justify-between p-4">
            <div className="flex items-start space-x-3 min-w-0">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: room.color }}
              />
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium truncate">{room.name}</span>
                  <Badge className={getStatusColor(room.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(room.status)}
                      <span className="capitalize">{room.status}</span>
                    </div>
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 truncate">{room.category} • {room.capacity} pax • ${room.hourlyRate}/hr</div>
                {room.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{room.description}</p>
                )}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {room.amenities.slice(0, 4).map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{amenity}</Badge>
                    ))}
                    {room.amenities.length > 4 && (
                      <Badge variant="outline" className="text-xs">+{room.amenities.length - 4} more</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(room._id || room.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <SettingsIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600 mb-4">
              {filterStatus !== 'all' || filterCategory !== 'all' 
                ? 'Try adjusting your filters to see more rooms.'
                : 'Get started by creating your first room.'
              }
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Room Form Modal */}
      {showForm && (
        <RoomForm
          room={selectedRoom}
          isEditing={isEditing}
          onClose={() => {
            setShowForm(false);
            setSelectedRoom(null);
            setIsEditing(false);
          }}
          onSave={(data) => {
            if (isEditing) {
              updateRoomMutation.mutate({ id: selectedRoom._id, data });
            } else {
              createRoomMutation.mutate(data);
            }
          }}
          saving={isEditing ? updateRoomMutation.isPending : createRoomMutation.isPending}
          categories={categories}
        />
      )}
    </div>
  );
};

// Room Form Component
const RoomForm = ({ room, isEditing, onClose, onSave, categories, saving = false }) => {
  const [formData, setFormData] = useState({
    name: room?.name || '',
    capacity: room?.capacity || 8,
    type: room?.type || 'medium',
    category: room?.category || 'Standard',
    status: room?.status || 'active',
    color: room?.color || '#3B82F6',
    description: room?.description || '',
    amenities: room?.amenities || [],
    hourlyRate: room?.hourlyRate || 0,
    isBookable: room?.isBookable !== undefined ? room.isBookable : true,
    sortOrder: room?.sortOrder || 0
  });

  const [newAmenity, setNewAmenity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Provide server-compatible data, ensuring required fields exist
    const payload = {
      ...formData,
      isActive: formData.status !== 'inactive',
    };
    onSave(payload);
  };

  const handleAmenityAdd = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const handleAmenityRemove = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Exit Button - Top Right Corner */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 h-12 w-12 z-10 bg-white hover:bg-gray-100 border border-gray-200 shadow-lg"
        >
          <X className="h-8 w-8 font-bold text-gray-700" />
        </Button>
        
        <CardHeader className="pr-16">
          <CardTitle>
            {isEditing ? 'Edit Room' : 'Create New Room'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Room Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter room name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Capacity</label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  min="1"
                  max="100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <CustomSelect
                  value={formData.type}
                  onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  options={[
                    { value: 'medium', label: 'Medium (up to 8 people)' },
                    { value: 'large', label: 'Large (up to 15 people)' },
                    { value: 'party', label: 'Party (up to 25 people)' }
                  ]}
                  placeholder="Select room type"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <CustomSelect
                  value={formData.category}
                  onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  options={[
                    { value: 'Standard', label: 'Standard' },
                    { value: 'Premium', label: 'Premium' },
                    { value: 'VIP', label: 'VIP' },
                    ...categories.filter(cat => !['Standard', 'Premium', 'VIP'].includes(cat))
                      .map(category => ({ value: category, label: category }))
                  ]}
                  placeholder="Select category"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <CustomSelect
                  value={formData.status}
                  onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'maintenance', label: 'Maintenance' }
                  ]}
                  placeholder="Select status"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hourly Rate ($)</label>
                <Input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) }))}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter room description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
              />
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amenities</label>
              <div className="flex space-x-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="Add amenity"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAmenityAdd())}
                />
                <Button type="button" onClick={handleAmenityAdd}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((amenity, index) => (
                  <Badge key={index} variant="outline" className="flex items-center space-x-1">
                    <span>{amenity}</span>
                    <button
                      type="button"
                      onClick={() => handleAmenityRemove(amenity)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isBookable"
                checked={formData.isBookable}
                onChange={(e) => setFormData(prev => ({ ...prev, isBookable: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="isBookable" className="text-sm font-medium">
                Available for booking
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : (isEditing ? 'Update Room' : 'Create Room')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomManagement;
