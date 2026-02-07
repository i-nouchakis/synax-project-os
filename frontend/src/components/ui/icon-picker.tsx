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
  MdRouter,
  MdCable,
  MdSecurity,
  MdMonitor,
  MdComputer,
  MdPrint,
  MdKeyboard,
  MdMouse,
  MdUsb,
  MdMemory,
  MdSettingsEthernet,
  MdDeviceHub,
  MdCast,
  MdSpeaker,
  MdPhoneAndroid,
  MdDesktopWindows,
  MdTv,
  MdVideocam,
  MdPowerSettingsNew,
  MdDns,
  MdCloud,
  MdLan,
  MdElectricalServices,
  MdSettingsInputAntenna,
  MdSdCard,
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
  FaPlug,
  FaHdd,
  FaDatabase,
  FaMicrochip,
  FaSatelliteDish,
  FaDesktop,
  FaLaptop,
  FaPrint,
  FaShieldAlt,
  FaTabletAlt,
  FaUsb,
  FaKeyboard,
} from 'react-icons/fa';

import {
  BsDoorOpenFill,
  BsReception4,
  BsLamp,
  BsHouseDoor,
  BsEthernet,
  BsCpu,
  BsGpuCard,
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

// Network / IT asset icons
export const ASSET_ICONS: Record<string, { name: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  // Network Infrastructure
  'FaServer': { name: 'Server', icon: FaServer },
  'MdRouter': { name: 'Router', icon: MdRouter },
  'FaNetworkWired': { name: 'Switch', icon: FaNetworkWired },
  'FaShieldAlt': { name: 'Firewall', icon: FaShieldAlt },
  'FaWifi': { name: 'Access Point', icon: FaWifi },
  'MdDns': { name: 'DNS Server', icon: MdDns },
  'MdCloud': { name: 'Cloud', icon: MdCloud },
  'MdDeviceHub': { name: 'Hub', icon: MdDeviceHub },
  'MdLan': { name: 'LAN', icon: MdLan },
  'MdSettingsEthernet': { name: 'Ethernet', icon: MdSettingsEthernet },
  'BsEthernet': { name: 'Ethernet Port', icon: BsEthernet },

  // Power & Electrical
  'FaPlug': { name: 'Power Outlet', icon: FaPlug },
  'FaBolt': { name: 'UPS', icon: FaBolt },
  'MdPowerSettingsNew': { name: 'Power Supply', icon: MdPowerSettingsNew },
  'MdElectricalServices': { name: 'Electrical Panel', icon: MdElectricalServices },

  // Connectivity & Cabling
  'MdCable': { name: 'Cable', icon: MdCable },
  'MdSettingsInputAntenna': { name: 'Antenna', icon: MdSettingsInputAntenna },
  'FaSatelliteDish': { name: 'Satellite Dish', icon: FaSatelliteDish },
  'FaUsb': { name: 'USB', icon: FaUsb },
  'MdUsb': { name: 'USB Port', icon: MdUsb },
  'MdCast': { name: 'Streaming', icon: MdCast },

  // End Devices
  'MdDesktopWindows': { name: 'Desktop PC', icon: MdDesktopWindows },
  'FaDesktop': { name: 'Workstation', icon: FaDesktop },
  'FaLaptop': { name: 'Laptop', icon: FaLaptop },
  'MdMonitor': { name: 'Monitor', icon: MdMonitor },
  'FaPrint': { name: 'Printer', icon: FaPrint },
  'MdPrint': { name: 'MFP Printer', icon: MdPrint },
  'MdPhoneAndroid': { name: 'VoIP Phone', icon: MdPhoneAndroid },
  'MdTv': { name: 'Smart TV', icon: MdTv },
  'MdVideocam': { name: 'IP Camera', icon: MdVideocam },
  'GiCctvCamera': { name: 'CCTV Camera', icon: GiCctvCamera },
  'FaTabletAlt': { name: 'Tablet', icon: FaTabletAlt },
  'MdSpeaker': { name: 'Speaker', icon: MdSpeaker },
  'FaKeyboard': { name: 'Keyboard', icon: FaKeyboard },
  'MdKeyboard': { name: 'Input Device', icon: MdKeyboard },
  'MdMouse': { name: 'Mouse', icon: MdMouse },
  'MdComputer': { name: 'Computer', icon: MdComputer },

  // Storage
  'FaHdd': { name: 'Hard Drive / NAS', icon: FaHdd },
  'FaDatabase': { name: 'Database', icon: FaDatabase },
  'MdStorage': { name: 'Storage', icon: MdStorage },
  'MdSdCard': { name: 'Media Card', icon: MdSdCard },

  // Components
  'FaMicrochip': { name: 'Controller', icon: FaMicrochip },
  'BsCpu': { name: 'CPU', icon: BsCpu },
  'BsGpuCard': { name: 'GPU', icon: BsGpuCard },
  'MdMemory': { name: 'RAM', icon: MdMemory },
  'MdSecurity': { name: 'Security Module', icon: MdSecurity },
};

// Get icon component by key (checks both room and asset icons)
export function getRoomTypeIcon(iconKey: string | null | undefined): React.ComponentType<{ size?: number; className?: string }> | null {
  if (!iconKey) return null;
  return ROOM_TYPE_ICONS[iconKey]?.icon || ASSET_ICONS[iconKey]?.icon || null;
}

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (iconKey: string) => void;
  className?: string;
  iconSet?: 'room' | 'asset';
}

export function IconPicker({ value, onChange, className, iconSet = 'room' }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const icons = iconSet === 'asset' ? ASSET_ICONS : ROOM_TYPE_ICONS;

  const filteredIcons = Object.entries(icons).filter(([, data]) =>
    data.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedIcon = value ? (icons[value] || ROOM_TYPE_ICONS[value] || ASSET_ICONS[value]) : null;
  const SelectedIconComponent = selectedIcon?.icon;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selected icon display */}
      {SelectedIconComponent && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <SelectedIconComponent size={18} className="text-primary" />
          </div>
          <span className="text-body-sm font-medium text-primary">{selectedIcon?.name}</span>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search icons..."
        className="w-full px-3 py-2 bg-surface-secondary border border-surface-border rounded-md text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary"
      />

      {/* Icons grid */}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-surface-border bg-surface-secondary p-3">
        {filteredIcons.length === 0 ? (
          <div className="py-4 text-center text-text-tertiary">
            <p className="text-body-sm">No icons found</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2.5">
            {filteredIcons.map(([key, data]) => {
              const IconComponent = data.icon;
              const isSelected = value === key;
              return (
                <button
                  key={key}
                  type="button"
                  title={data.name}
                  onClick={() => onChange(key)}
                  className={cn(
                    'w-11 h-11 rounded-lg flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-primary ring-2 ring-primary text-white'
                      : 'bg-surface-hover text-text-primary hover:bg-primary/30 hover:text-white'
                  )}
                >
                  <IconComponent size={22} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
