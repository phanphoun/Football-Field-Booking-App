import React from 'react'
import { FieldCard } from '../components'

const Fields = () => {
  const fields = [
    {
      id: 1,
      name: "Central Sports Complex",
      location: "Downtown District",
      price: 50,
      rating: 4.8,
      image: "/field1.jpg",
      amenities: ["Parking", "Showers", "Lights"]
    },
    {
      id: 2,
      name: "Riverside Football Club",
      location: "Riverside Area",
      price: 45,
      rating: 4.6,
      image: "/field2.jpg",
      amenities: ["Parking", "Equipment"]
    },
    {
      id: 3,
      name: "Community Sports Center",
      location: "Suburban Zone",
      price: 35,
      rating: 4.5,
      image: "/field3.jpg",
      amenities: ["Parking", "Cafe"]
    }
  ]

  return (
    <div className="fields-page">
      <div className="container">
        <h1>Available Football Fields</h1>
        <div className="filters">
          <select className="filter-select">
            <option>All Locations</option>
            <option>Downtown</option>
            <option>Riverside</option>
            <option>Suburban</option>
          </select>
          <select className="filter-select">
            <option>Price Range</option>
            <option>$0-$30</option>
            <option>$30-$50</option>
            <option>$50+</option>
          </select>
        </div>
        <div className="fields-grid">
          {fields.map(field => (
            <FieldCard key={field.id} field={field} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Fields
