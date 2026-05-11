fetch('http://localhost:5000/api/cars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        brand: "Range Rover",
        model: "Evoque 2024",
        registration: "12345-A-1",
        pricePerDay: 1500,
        category: "VIP"
    })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.log(err));