const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    registration: { type: String, required: false }, // ردها false باش ما تتبلوكاش
    pricePerDay: { type: Number, required: true },
    category: { 
        type: String, 
        default: 'اقتصادية'
    },
    images: { type: [String], default: ['https://via.placeholder.com/400x300?text=No+Image'] },
    location: { type: String, required: true }, // المدينة ضرورية للبحث
    isAvailable: { type: Boolean, default: true },
    bookedDates: [{ start: Date, end: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);