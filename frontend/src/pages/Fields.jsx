import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, Filter, Star, DollarSign, Clock } from 'lucide-react';
import './Fields.css';

const Fields = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedType, setSelectedType] = useState('all');

    // Mock data - will be replaced with API calls
    const fields = [
        {
            id: 1,
            name: 'Olympic Stadium Field',
            address: 'Phnom Penh, Cambodia',
            city: 'Phnom Penh',
            type: '11v11',
            pricePerHour: 50,
            rating: 4.8,
            reviews: 124,
            image: 'https://via.placeholder.com/400x300/22c55e/ffffff?text=Football+Field',
            amenities: ['Parking', 'Changing Rooms', 'Lights'],
            status: 'available',
        },
        {
            id: 2,
            name: 'Riverside Football Arena',
            address: 'Phnom Penh, Cambodia',
            city: 'Phnom Penh',
            type: '7v7',
            pricePerHour: 35,
            rating: 4.6,
            reviews: 89,
            image: 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=Football+Field',
            amenities: ['Parking', 'Lights', 'Cafe'],
            status: 'available',
        },
        {
            id: 3,
            name: 'Siem Reap Sports Complex',
            address: 'Siem Reap, Cambodia',
            city: 'Siem Reap',
            type: '5v5',
            pricePerHour: 25,
            rating: 4.9,
            reviews: 156,
            image: 'https://via.placeholder.com/400x300/f97316/ffffff?text=Football+Field',
            amenities: ['Parking', 'Changing Rooms', 'Lights', 'Shop'],
            status: 'available',
        },
        {
            id: 4,
            name: 'Battambang Field Club',
            address: 'Battambang, Cambodia',
            city: 'Battambang',
            type: '11v11',
            pricePerHour: 40,
            rating: 4.7,
            reviews: 67,
            image: 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Football+Field',
            amenities: ['Parking', 'Changing Rooms'],
            status: 'available',
        },
    ];

    const cities = ['all', 'Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville'];
    const fieldTypes = ['all', '5v5', '7v7', '11v11'];

    const filteredFields = fields.filter(field => {
        const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            field.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCity = selectedCity === 'all' || field.city === selectedCity;
        const matchesType = selectedType === 'all' || field.type === selectedType;
        return matchesSearch && matchesCity && matchesType;
    });

    return (
        <div className="fields-page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">Browse Football Fields</h1>
                    <p className="page-subtitle">
                        Find and book the perfect field for your next match across Cambodia
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="search-section">
                    <div className="search-bar">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search by field name or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filters">
                        <div className="filter-group">
                            <Filter size={18} />
                            <select
                                className="input"
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                            >
                                {cities.map(city => (
                                    <option key={city} value={city}>
                                        {city === 'all' ? 'All Cities' : city}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <select
                                className="input"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                {fieldTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type === 'all' ? 'All Types' : type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="results-info">
                    <p>{filteredFields.length} field{filteredFields.length !== 1 ? 's' : ''} found</p>
                </div>

                {/* Fields Grid */}
                <div className="fields-grid">
                    {filteredFields.map((field, index) => (
                        <div key={field.id} className="field-card card animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="field-image">
                                <img src={field.image} alt={field.name} />
                                <div className="field-badge badge badge-success">{field.status}</div>
                                <div className="field-type-badge">{field.type}</div>
                            </div>

                            <div className="field-content">
                                <h3 className="field-name">{field.name}</h3>

                                <div className="field-location">
                                    <MapPin size={16} />
                                    <span>{field.address}</span>
                                </div>

                                <div className="field-rating">
                                    <Star size={16} fill="currentColor" />
                                    <span className="rating-value">{field.rating}</span>
                                    <span className="rating-count">({field.reviews} reviews)</span>
                                </div>

                                <div className="field-amenities">
                                    {field.amenities.slice(0, 3).map((amenity, i) => (
                                        <span key={i} className="amenity-tag">{amenity}</span>
                                    ))}
                                    {field.amenities.length > 3 && (
                                        <span className="amenity-tag">+{field.amenities.length - 3}</span>
                                    )}
                                </div>

                                <div className="field-footer">
                                    <div className="field-price">
                                        <DollarSign size={18} />
                                        <span className="price-value">${field.pricePerHour}</span>
                                        <span className="price-unit">/hour</span>
                                    </div>

                                    <Link to={`/fields/${field.id}`} className="btn btn-primary btn-sm">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredFields.length === 0 && (
                    <div className="empty-state">
                        <MapPin className="empty-state-icon" size={80} />
                        <h3 className="empty-state-title">No fields found</h3>
                        <p className="empty-state-description">
                            Try adjusting your search or filters to find more fields
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Fields;
