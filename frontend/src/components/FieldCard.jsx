import React from 'react'
import { MapPin, Star, DollarSign } from 'lucide-react'

const FieldCard = ({ field }) => {
  return (
    <div className="field-card">
      <div className="field-image">
        <img src={field.image} alt={field.name} />
      </div>
      <div className="field-info">
        <h3>{field.name}</h3>
        <div className="field-location">
          <MapPin size={16} />
          <span>{field.location}</span>
        </div>
        <div className="field-rating">
          <Star size={16} className="star" />
          <span>{field.rating}</span>
        </div>
        <div className="field-price">
          <DollarSign size={16} />
          <span>${field.price}/hour</span>
        </div>
        <div className="field-amenities">
          {field.amenities.map((amenity, index) => (
            <span key={index} className="amenity">{amenity}</span>
          ))}
        </div>
        <button className="btn btn-primary">Book Now</button>
      </div>
    </div>
  )
}

export default FieldCard
