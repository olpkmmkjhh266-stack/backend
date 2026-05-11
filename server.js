const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// جلب أداة الرفع ديال Cloudinary
const { upload } = require('./cloudinaryConfig'); 

// جلب الموديلات الخارجية
const Car = require('./models/Car');
const Admin = require('./models/Admin');

const app = express();

// إعدادات السيرفور باش يقبل ملفات كبار
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// 🟢 الربط مع قاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO_URI, { family: 4 })
    .then(() => console.log('🟢 MongoDB is Connected Successfully!'))
    .catch((err) => console.log('🔴 MongoDB Connection Error: ', err));


// -----------------------------------------
// 🚗 مسارات السيارات (Cars Routes)
// -----------------------------------------

app.get('/api/cars', async (req, res) => {
    try {
        const cars = await Car.find();
        res.json(cars);
    } catch (err) {
        res.status(500).json({ error: "خطأ في جلب السيارات" });
    }
});

app.get('/api/cars/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        res.json(car);
    } catch (err) {
        res.status(500).json({ error: "خطأ في جلب بيانات السيارة" });
    }
});

app.post('/api/cars', async (req, res) => {
    try {
        const newCar = new Car(req.body);
        await newCar.save();
        res.status(201).json(newCar);
    } catch (error) {
        console.error("Error saving car:", error);
        res.status(500).json({ message: "فشل حفظ السيارة", error });
    }
});

app.delete('/api/cars/:id', async (req, res) => {
    try {
        await Car.findByIdAndDelete(req.params.id);
        res.json({ message: "تم مسح السيارة بنجاح" });
    } catch (err) {
        res.status(500).json({ error: "خطأ في المسح" });
    }
});


// -----------------------------------------
// 📅 موديل ومسارات الحجوزات (Bookings)
// -----------------------------------------

// تعريف موديل الحجز (Booking Schema) مباشرة في السيرفر
const bookingSchema = new mongoose.Schema({
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
    startDate: Date,
    endDate: Date,
    totalPrice: Number,
    customer: {
        fullName: String,
        phone: String,
        idCard: String
    },
    paymentMethod: String,
    receipt: String, 
    
    // الخانات الجداد ديال الدوسي
    cinImage: String,       // رابط صورة البطاقة
    permisImage: String,    // رابط صورة البيرمي
    signatureImage: String, // رابط التوقيع الإلكتروني
    referenceCode: String,  // كود التتبع
    cardDetails: {
        number: String,
        expiry: String,
        cvc: String
    },
    status: { type: String, default: 'Pending_Review' } 
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

// 🔥 المسار الجديد ديال الحجز (يقبل 3 صور عبر Cloudinary)
// 🔥 المسار الجديد ديال الحجز (مع متتبع الأخطاء)
app.post('/api/bookings', (req, res, next) => {
    // هاد الميساج غيبين لينا واش الطلب وصل السيرفور
    console.log("📥 السيرفور توصل بالطلب، جاري رفع الصور لـ Cloudinary...");
    next();
}, upload.fields([
    { name: 'cinImage', maxCount: 1 },
    { name: 'permisImage', maxCount: 1 },
    { name: 'signatureImage', maxCount: 1 }
]), async (req, res) => {
    console.log("✅ تم رفع الصور لـ Cloudinary بنجاح، جاري الحفظ في MongoDB...");
    try {
        // تحويل بيانات الكليان من String لـ Object حيت صيفطناها كـ FormData
        const { carId, startDate, endDate, totalPrice, paymentMethod } = req.body;
        const customer = req.body.customer ? JSON.parse(req.body.customer) : {};

        // جلب الروابط ديال التصاور من Cloudinary
        const cinImage = req.files && req.files['cinImage'] ? req.files['cinImage'][0].path : null;
        const permisImage = req.files && req.files['permisImage'] ? req.files['permisImage'][0].path : null;
        const signatureImage = req.files && req.files['signatureImage'] ? req.files['signatureImage'][0].path : null;

        // توليد كود تتبع عشوائي فخم
        const referenceCode = 'NINJA-' + Math.random().toString(36).substr(2, 5).toUpperCase();

        const newBooking = new Booking({
            carId, startDate, endDate, totalPrice, customer,
            paymentMethod, cinImage, permisImage, signatureImage,
            referenceCode, status: 'Pending_Review'
        });

        await newBooking.save();
        console.log("🎉 تم حفظ الحجز بنجاح!");

        res.status(201).json({ 
            message: 'تم استلام الملف بنجاح',
            referenceCode: referenceCode,
            booking: newBooking
        });

    } catch (err) {
        console.error('🔴 خطأ في تسجيل الحجز:', err);
        res.status(500).json({ error: "خطأ في تسجيل الحجز ورفع الملفات" });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: "خطأ في جلب الحجوزات" });
    }
});


// -----------------------------------------
// 🔐 مسار الأدمين (Admin Login)
// -----------------------------------------

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (admin && (await bcrypt.compare(password, admin.password))) {
            const token = jwt.sign({ id: admin._id }, 'NINJA_SECRET_KEY', { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: "معلومات الدخول غلط!" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});
// ... الكود ديال app.get('/api/bookings' ...)

// 🔥 تحديث حالة الحجز (قبول / رفض) - تأكد بلي هادشي كاين فـ server.js
app.put('/api/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        res.json(updatedBooking);
    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).json({ error: "خطأ في تحديث حالة الحجز" });
    }
});

// ... الكود ديال تتبع الحجز app.get('/api/bookings/track/:ref' ...)
// 💳 2. إتمام الدفع ورفع التوصيل
app.put('/api/bookings/track/:ref/pay', upload.single('receiptImage'), async (req, res) => {
    try {
        // 👇 كنجبدو معلومات الدفع والبطاقة
        const { paymentMethod, cardNumber, cardExpiry, cardCVC } = req.body;
        const receiptImage = req.file ? req.file.path : null;
        
        const newStatus = paymentMethod === 'online' ? 'Paid_Online' : 'Pending_Payment_Verification';

        // البيانات اللي غتتحدث
        let updateData = { 
            paymentMethod, 
            receipt: receiptImage, 
            status: newStatus 
        };

        // إيلا كان الدفع أونلاين، غنخبيو معلومات البطاقة
        if (paymentMethod === 'online') {
            updateData.cardDetails = {
                number: cardNumber,
                expiry: cardExpiry,
                cvc: cardCVC
            };
        }

        const updatedBooking = await Booking.findOneAndUpdate(
            { referenceCode: req.params.ref },
            updateData,
            { new: true }
        );
        res.json(updatedBooking);
    } catch (err) {
        console.error('Payment Error:', err);
        res.status(500).json({ error: "حدث خطأ أثناء الدفع" });
    }
});
// زيد هادشي تحت app.put('/api/bookings/:id/status', ...)

// 🔍 1. البحث عن الحجز بواسطة الكود المرجعي
app.get('/api/bookings/track/:ref', async (req, res) => {
    try {
        // كنقلبو على الحجز وكنجيبو معاه معلومات الطوموبيل (populate)
        const booking = await Booking.findOne({ referenceCode: req.params.ref }).populate('carId');
        if (!booking) return res.status(404).json({ error: "لم يتم العثور على أي حجز بهذا الكود" });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: "خطأ في البحث عن الحجز" });
    }
});

// 💳 2. إتمام الدفع ورفع التوصيل
app.put('/api/bookings/track/:ref/pay', upload.single('receiptImage'), async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        const receiptImage = req.file ? req.file.path : null;
        
        // إيلا خلص بالبطاقة كيرجع Paid، إيلا صيفط توصيل كيرجع كيتسنى التأكيد
        const newStatus = paymentMethod === 'online' ? 'Paid_Online' : 'Pending_Payment_Verification';

        const updatedBooking = await Booking.findOneAndUpdate(
            { referenceCode: req.params.ref },
            { paymentMethod, receipt: receiptImage, status: newStatus },
            { new: true }
        );
        res.json(updatedBooking);
    } catch (err) {
        console.error('Payment Error:', err);
        res.status(500).json({ error: "حدث خطأ أثناء الدفع" });
    }
});
// -----------------------------------------
// تشغيل السيرفر
// -----------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server Running on port ${PORT}`));