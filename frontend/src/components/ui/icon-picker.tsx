import { useState } from 'react';
import { cn } from '@/lib/utils';

// Import room-related icons from react-icons
import {
  MdBed,
  MdBathtub,
  MdKitchen,
  MdLiving,
  MdMeetingRoom,
  MdBalcony,
  MdGarage,
  MdElevator,
  MdStairs,
  MdPool,
  MdFitnessCenter,
  MdLocalLaundryService,
  MdStorage,
  MdRestaurant,
  MdCoffee,
  MdChair,
  MdDesk,
  MdSpa,
  MdLocalBar,
  MdTheaters,
  MdChildCare,
  MdPets,
  MdLocalParking,
  MdWc,
  MdShower,
  MdHotTub,
  MdDoorFront,
  MdRoofing,
  MdWarehouse,
  MdHomeWork,
} from 'react-icons/md';

import {
  FaBed,
  FaCouch,
  FaUtensils,
  FaDoorOpen,
  FaWarehouse,
  FaServer,
  FaNetworkWired,
  FaBolt,
  FaFan,
  FaFire,
  FaSnowflake,
  FaWifi,
  FaBuilding,
  FaHospital,
  FaChurch,
  FaStore,
  FaSchool,
  FaHotel,
  FaWineGlass,
} from 'react-icons/fa';

import {
  BsDoorOpenFill,
  BsReception4,
  BsLamp,
  BsHouseDoor,
} from 'react-icons/bs';

import {
  GiOfficeChair,
  GiLockers,
  GiCctvCamera,
  GiTheater,
  GiPrayerBeads,
} from 'react-icons/gi';

import {
  TbAirConditioning,
  TbToolsKitchen2,
} from 'react-icons/tb';

// Room type icons with their display names and components
export const ROOM_TYPE_ICONS: Record<string, { name: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  // Accommodation
  'MdBed': { name: 'Bedroom', icon: MdBed },
  'FaBed': { name: 'Bed', icon: FaBed },
  'MdBathtub': { name: 'Bathroom', icon: MdBathtub },
  'MdShower': { name: 'Shower', icon: MdShower },
  'MdWc': { name: 'WC', icon: MdWc },
  'MdHotTub': { name: 'Hot Tub', icon: MdHotTub },

  // Living Areas
  'MdLiving': { name: 'Living Room', icon: MdLiving },
  'FaCouch': { name: 'Lounge', icon: FaCouch },
  'MdChair': { name: 'Sitting Area', icon: MdChair },
  'MdBalcony': { name: 'Balcony', icon: MdBalcony },

  // Kitchen & Dining
  'MdKitchen': { name: 'Kitchen', icon: MdKitchen },
  'TbToolsKitchen2': { name: 'Kitchenette', icon: TbToolsKitchen2 },
  'MdRestaurant': { name: 'Restaurant', icon: MdRestaurant },
  'FaUtensils': { name: 'Dining', icon: FaUtensils },
  'MdCoffee': { name: 'Coffee Area', icon: MdCoffee },
  'MdLocalBar': { name: 'Bar', icon: MdLocalBar },
  'FaWineGlass': { name: 'Wine Bar', icon: FaWineGlass },

  // Work & Office
  'MdDesk': { name: 'Office', icon: MdDesk },
  'GiOfficeChair': { name: 'Workspace', icon: GiOfficeChair },
  'MdMeetingRoom': { name: 'Meeting Room', icon: MdMeetingRoom },
  'BsReception4': { name: 'Reception', icon: BsReception4 },

  // Amenities
  'MdPool': { name: 'Pool', icon: MdPool },
  'MdFitnessCenter': { name: 'Gym', icon: MdFitnessCenter },
  'MdSpa': { name: 'Spa', icon: MdSpa },
  'MdTheaters': { name: 'Theater', icon: MdTheaters },
  'GiTheater': { name: 'Cinema', icon: GiTheater },
  'MdChildCare': { name: 'Kids Room', icon: MdChildCare },
  'MdPets': { name: 'Pet Area', icon: MdPets },
  'GiPrayerBeads': { name: 'Prayer Room', icon: GiPrayerBeads },

  // Service Areas
  'MdLocalLaundryService': { name: 'Laundry', icon: MdLocalLaundryService },
  'MdStorage': { name: 'Storage', icon: MdStorage },
  'GiLockers': { name: 'Lockers', icon: GiLockers },
  'FaWarehouse': { name: 'Warehouse', icon: FaWarehouse },
  'MdWarehouse': { name: 'Stock Room', icon: MdWarehouse },

  // Infrastructure
  'MdGarage': { name: 'Garage', icon: MdGarage },
  'MdLocalParking': { name: 'Parking', icon: MdLocalParking },
  'MdElevator': { name: 'Elevator', icon: MdElevator },
  'MdStairs': { name: 'Stairs', icon: MdStairs },
  'MdDoorFront': { name: 'Entrance', icon: MdDoorFront },
  'FaDoorOpen': { name: 'Door', icon: FaDoorOpen },
  'BsDoorOpenFill': { name: 'Doorway', icon: BsDoorOpenFill },
  'BsHouseDoor': { name: 'Main Door', icon: BsHouseDoor },

  // Technical Rooms
  'FaServer': { name: 'Server Room', icon: FaServer },
  'FaNetworkWired': { name: 'Network', icon: FaNetworkWired },
  'FaBolt': { name: 'Electrical', icon: FaBolt },
  'FaFan': { name: 'Ventilation', icon: FaFan },
  'TbAirConditioning': { name: 'HVAC', icon: TbAirConditioning },
  'FaFire': { name: 'Boiler Room', icon: FaFire },
  'FaSnowflake': { name: 'Cold Storage', icon: FaSnowflake },
  'GiCctvCamera': { name: 'Security', icon: GiCctvCamera },
  'FaWifi': { name: 'Comms Room', icon: FaWifi },

  // Building Types
  'MdRoofing': { name: 'Roof', icon: MdRoofing },
  'MdHomeWork': { name: 'Home Office', icon: MdHomeWork },
  'BsLamp': { name: 'Lobby', icon: BsLamp },
  'FaBuilding': { name: 'Building', icon: FaBuilding },
  'FaHotel': { name: 'Hotel', icon: FaHotel },
  'FaHospital': { name: 'Medical', icon: FaHospital },
  'FaChurch': { name: 'Chapel', icon: FaChurch },
  'FaStore': { name: 'Shop', icon: FaStore },
  'FaSchool': { name: 'Classroom', icon: FaSchool },
};

// Get icon component by key
export function getRoomTypeIcon(iconKey: string | null | undefined): React.ComponentType<{ size?: number; className?: string }> | null {
  if (!iconKey) return null;
  return ROOM_TYPE_ICONS[iconKey]?.icon || null;
}

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (iconKey: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = Object.entries(ROOM_TYPE_ICONS).filter(([, data]) =>
    data.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedIcon = value ? ROOM_TYPE_ICONS[value] : null;
  const SelectedIconComponent = selectedIcon?.icon;

  return (
    <div className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-md border transition-colors text-left',
          'bg-surface border-surface-border hover:border-primary/50',
          isOpen && 'border-primary ring-2 ring-primary/20'
        )}
      >
        {SelectedIconComponent ? (
          <>
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <SelectedIconComponent size={20} className="text-primary" />
            </div>
            <span className="text-body text-text-primary">{selectedIcon?.name}</span>
          </>
        ) : (
          <span className="text-body text-text-tertiary">Select an icon...</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Picker panel */}
          <div className="absolute top-full left-0 mt-1 w-80 max-h-96 bg-surface border border-surface-border rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-surface-border">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full px-3 py-2 bg-surface-secondary border border-surface-border rounded-md text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>

            {/* Icons grid */}
            <div className="p-2 max-h-72 overflow-y-auto">
              <div className="grid grid-cols-5 gap-1">
                {filteredIcons.map(([key, data]) => {
                  const IconComponent = data.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onChange(key);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      title={data.name}
                      className={cn(
                        'p-2 rounded-md transition-colors flex items-center justify-center',
                        'hover:bg-surface-hover',
                        value === key && 'bg-primary/10 text-primary'
                      )}
                    >
                      <IconComponent size={24} className={value === key ? 'text-primary' : 'text-text-secondary'} />
                    </button>
                  );
                })}
              </div>

              {filteredIcons.length === 0 && (
                <p className="text-center text-body-sm text-text-tertiary py-4">
                  No icons found
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
