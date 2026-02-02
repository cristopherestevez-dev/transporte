const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/transporte?authSource=admin';
const DB_JSON_PATH = path.join(__dirname, '../frontend/public/db.json');

async function migrate() {
    console.log('🚀 Iniciando migración de db.json a MongoDB...\n');
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');
        
        const db = client.db('transporte');
        
        // Leer db.json
        const rawData = fs.readFileSync(DB_JSON_PATH, 'utf-8');
        const data = JSON.parse(rawData);
        
        // Colecciones a migrar (mapeo de nombres)
        const collections = {
            'users': data.users || [],
            'proveedores': data.proveedores || [],
            'fleteros': data.fleteros || [],
            'viajesNacionales': data.viajesNacionales || [],
            'viajesInternacionales': data.viajesInternacionales || [],
            'camiones': data.camiones || [],
            'semirremolques': data.semirremolques || [],
            'choferes': data.choferes || [],
            'cobranzasNacionales': data.facturacion?.cobranzas?.nacionales || [],
            'cobranzasInternacionales': data.facturacion?.cobranzas?.internacionales || [],
            'pagosNacionales': data.facturacion?.pagos?.nacionales || [],
            'pagosInternacionales': data.facturacion?.pagos?.internacionales || []
        };
        
        // Migrar cada colección
        for (const [collectionName, documents] of Object.entries(collections)) {
            if (documents.length > 0) {
                // Limpiar colección existente
                await db.collection(collectionName).deleteMany({});
                
                // Insertar documentos
                const result = await db.collection(collectionName).insertMany(documents);
                console.log(`✅ ${collectionName}: ${result.insertedCount} documentos insertados`);
            } else {
                console.log(`⚠️  ${collectionName}: sin datos para migrar`);
            }
        }
        
        console.log('\n🎉 Migración completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n📡 Conexión a MongoDB cerrada');
    }
}

migrate();
