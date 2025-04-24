import express from 'express'
import cloudinary from 'cloudinary'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()

const app = express()

// CORS configurado para desarrollo y producción
const allowedOrigins = [
    'http://localhost:5173',
    'https://cooperativatp.netlify.app'
]

app.use(cors({
    origin: function (origin, callback) {
        // Permitir solicitudes sin origen (por ejemplo desde Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'POST', 'DELETE'],
}))

app.use(express.json())

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Ruta para eliminar imágenes por publicId
app.post("/delete-images", async (req, res) => {
    const { id } = req.body

    if (!Array.isArray(id) || id.length === 0) {
        return res.status(400).json({ error: "Se requiere un array de ids" });
    }

    try {
        const result = await cloudinary.api.delete_resources(id, {
            type: 'upload',
            resource_type: 'image',
        });

        res.json({ message: "Imágenes eliminadas", result });
    } catch (error) {
        console.error("Error eliminando imágenes:", error);
        res.status(500).json({ error: "No se pudieron eliminar las imágenes" })
    }
})

// Ruta para eliminar carpetas por nombre
app.post('/delete-folders', async (req, res) => {
    const { folders } = req.body

    if (!folders || !Array.isArray(folders)) {
        return res.status(400).json({ success: false, message: 'Debes enviar una lista de carpetas' })
    }

    try {
        const results = []

        for (const folder of folders) {
            // Eliminar recursos dentro del folder
            const resources = await cloudinary.api.delete_resources_by_prefix(folder)
            console.log(`Recursos eliminados en ${folder}:`, resources)

            // Eliminar el folder
            const result = await cloudinary.api.delete_folder(folder)
            console.log(`Folder ${folder} eliminado:`, result)

            results.push({ folder, result })
        }

        res.json({ success: true, results })

    } catch (e) {
        console.error(e)
        res.status(500).json({ success: false, message: e.message })
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})