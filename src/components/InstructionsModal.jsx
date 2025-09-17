import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { X, HelpCircle } from 'lucide-react';

const InstructionsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Exit Button - Top Right Corner */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 h-12 w-12 z-10 bg-white hover:bg-gray-100 border border-gray-200 shadow-lg"
        >
          <X className="h-8 w-8 font-bold text-gray-700" />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" />
            <span>How to use Boom Karaoke</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Scheduling</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Navigate days with the arrows by the date. Click a day in the mini calendar to jump.</li>
              <li>Create a booking by clicking a slot in the grid, or use the round + button.</li>
              <li>Drag a booking to another time/room. Drop onto another booking to swap.</li>
              <li>Long‑press a booking to enable quick edit, then drag the top/bottom (vertical) or left/right (horizontal) edge to resize.</li>
              <li>Click a booking to view details; from there you can edit, mark no‑show, or delete.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Colors & Legend</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Enable “Color by Booking Source” in Settings → Display to color bookings by Walk‑in/Phone/Email/etc.</li>
              <li>Adjust each source color below the mini calendar legend.</li>
              <li>When source coloring is on, room dots turn gray to reduce confusion.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Managing Rooms & Bookings</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Open Settings → Rooms to add/edit rooms (name, capacity, rate, color, status).</li>
              <li>Open Settings → Bookings to search, edit, cancel, delete, or restore bookings.</li>
              <li>Deleted bookings are removed from the list. Cancel sets status to cancelled. Restore returns cancelled/no‑show to confirmed.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Layout & Hours</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Switch between Vertical (Rooms × Time) and Horizontal (Time × Rooms) in Settings → Layout.</li>
              <li>Adjust slot width/height per layout for visibility. Choose your timezone and business hours.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Tips</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Use the Today button in the mini calendar to quickly return to today.</li>
              <li>Notes preview appears on each booking; it’s white text for readability.</li>
              <li>Use the floating + button to quickly add a 1‑hour booking at the current hour.</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructionsModal;


