import React from 'react';
import moment from 'moment';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { X, Calendar, Clock, Users, Phone, Mail, User, Edit, Trash2 } from 'lucide-react';

const ReservationViewModal = ({ isOpen, onClose, booking, onEdit, onDelete, onNoShow }) => {
  if (!isOpen || !booking) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'no_show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'walk_in': return 'bg-blue-100 text-blue-800';
      case 'phone': return 'bg-green-100 text-green-800';
      case 'online': return 'bg-purple-100 text-purple-800';
      case 'email': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSource = (source) => {
    switch (source) {
      case 'walk_in': return 'Walk-in';
      case 'phone': return 'Phone';
      case 'online': return 'Online';
      case 'email': return 'Email';
      default: return source;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto relative">
        {/* Exit Button - Top Right Corner */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 h-12 w-12 z-10 bg-white hover:bg-gray-100 border border-gray-200 shadow-lg"
        >
          <X className="h-8 w-8 font-bold text-gray-700" />
        </Button>
        
        <CardHeader className="flex flex-row items-center space-y-0 pb-4 pr-16">
          <CardTitle className="text-xl font-semibold">Reservation Details</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Customer Name</label>
                <p className="text-sm text-gray-900 mt-1">{booking.customerName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {booking.phone || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {booking.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Party Size</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {booking.partySize || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Reservation Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Reservation Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <p className="text-sm text-gray-900 mt-1">
                  {moment(booking.startTime).format('MMMM DD, YYYY')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Time</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {moment(booking.startTime).format('h:mm A')} - {moment(booking.endTime).format('h:mm A')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Duration</label>
                <p className="text-sm text-gray-900 mt-1">
                  {moment(booking.endTime).diff(moment(booking.startTime), 'hours', true).toFixed(1)} hours
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Room</label>
                <p className="text-sm text-gray-900 mt-1">{booking.room?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Status and Source */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Status & Source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status || 'confirmed'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Source</label>
                <div className="mt-1">
                  <Badge className={getSourceColor(booking.source)}>
                    {formatSource(booking.source)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(booking.notes || booking.specialRequests || booking.pricing) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
              {booking.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-md">
                    {booking.notes}
                  </p>
                </div>
              )}
              {booking.specialRequests && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Special Requests</label>
                  <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-md">
                    {booking.specialRequests}
                  </p>
                </div>
              )}
              {booking.pricing && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Pricing</label>
                  <p className="text-sm text-gray-900 mt-1">${booking.pricing}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this reservation?')) {
                    onDelete(booking);
                  }
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            {onEdit && (
              <Button
                onClick={() => onEdit(booking)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Reservation
              </Button>
            )}
            {onNoShow && booking.status === 'confirmed' && (
              <Button
                onClick={() => onNoShow(booking)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <User className="h-4 w-4 mr-2" />
                Mark as No Show
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationViewModal;
