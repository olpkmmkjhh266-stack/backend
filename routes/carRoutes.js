const express = require('express');
const Car = require('../models/Car'); // عيطنا على القالب لي صاوبنا قبيلة
const router = express.Router();

// [POST] مسار لإضافة سيارة جديدة للقاعدة
router.post('/', async (req, res) => {
    try {
        // كنستقبلو المعلومات لي جاتنا
        const newCar = new Car(req.body);
        
        // كنحفظوها فـ MongoDB
        const savedCar = await newCar.save();
        
        // كنرجعو ميساج بلي العملية دازت بنجاح
        res.status(201).json({ 
            message: '🚗 طوموبيل تزادت بنجاح!', 
            car: savedCar 
        });
    } catch (error) {
        res.status(500).json({ error: "وقع شي مشكل: " + error.message });
    }
});
// [GET] مسار لجلب جميع السيارات من قاعدة البيانات
router.get('/', async (req, res) => {
    try {
        // كنقولو لـ MongoDB: "جيب لينا ݣاع الطوموبيلات لي عندك"
        const cars = await Car.find(); 
        
        // كنصيفطوهم للـ Front-end (أو المتصفح)
        res.status(200).json(cars);
    } catch (error) {
        res.status(500).json({ error: "وقع شي مشكل فـ جلب السيارات: " + error.message });
    }
});
// [DELETE] مسار لمسح سيارة من قاعدة البيانات
router.delete('/:id', async (req, res) => {
    try {
        // كنقلبو على الطوموبيل بـ الـ ID ديالها وكنمسحوها
        await Car.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: '🗑️ السيارة تمسحات بنجاح!' });
    } catch (error) {
        res.status(500).json({ error: "وقع شي مشكل فـ المسح: " + error.message });
    }
});
module.exports = router;
