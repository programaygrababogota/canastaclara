/* =========================================================
   CanastaClara — datos curados
   Aditivos frecuentes en alimentos empacados de la canasta
   familiar, normativas colombianas y fuentes de noticias.
   ========================================================= */
"use strict";

/* Riesgo: bajo | moderado | alto | debate
   Fuentes de referencia: EFSA (re-evaluation programme), JECFA/OMS, CSPI. */
const ADDITIVES = {
  "e100":  { nombre:"Curcumina", funcion:"Colorante", riesgo:"bajo", nota:"Colorante natural de la cúrcuma. Considerado seguro por la EFSA dentro de la ingesta diaria admisible (IDA 0-3 mg/kg).", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e102":  { nombre:"Tartrazina", funcion:"Colorante amarillo", riesgo:"alto", nota:"Colorante azoico sintético. La EFSA lo vinculó con hiperactividad infantil (estudio Southampton); en la UE obliga la advertencia 'puede tener efectos negativos sobre la actividad y la atención de los niños'. Frecuente en golosinas y bebidas en Colombia.", fuente:"https://www.efsa.europa.eu/en/efsajournal/pub/1331" },
  "e104":  { nombre:"Amarillo de quinoleína", funcion:"Colorante amarillo-verdoso", riesgo:"moderado", nota:"Colorante azoico; la EFSA redujo su IDA tras la reevaluación de 2009. Prohibido en EE. UU. y Japón.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e110":  { nombre:"Amarillo ocaso FCF", funcion:"Colorante amarillo-naranja", riesgo:"alto", nota:"Colorante azoico del grupo Southampton. Puede provocar reacciones en personas sensibles a la aspirina y se asocia con hiperactividad infantil.", fuente:"https://www.efsa.europa.eu/en/efsajournal/pub/1331" },
  "e120":  { nombre:"Carmín / ácido carmínico", funcion:"Colorante rojo", riesgo:"moderado", nota:"Origen animal (cochinilla). Puede causar alergias severas en personas sensibilizadas. No apto para dietas vegetarianas.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e122":  { nombre:"Azorrubina / carmoisina", funcion:"Colorante rojo", riesgo:"alto", nota:"Colorante azoico del grupo Southampton asociado a hiperactividad infantil.", fuente:"https://www.efsa.europa.eu/en/efsajournal/pub/1331" },
  "e124":  { nombre:"Rojo cochinilla A / Ponceau 4R", funcion:"Colorante rojo", riesgo:"alto", nota:"Colorante azoico del grupo Southampton; requiere advertencia en la UE por posibles efectos en la atención infantil.", fuente:"https://www.efsa.europa.eu/en/efsajournal/pub/1331" },
  "e129":  { nombre:"Rojo allura AC", funcion:"Colorante rojo", riesgo:"alto", nota:"Colorante azoico del grupo Southampton. Muy usado en golosinas colombianas. La EFSA mantiene vigilancia sobre su consumo infantil.", fuente:"https://www.efsa.europa.eu/en/efsajournal/pub/1331" },
  "e133":  { nombre:"Azul brillante FCF", funcion:"Colorante azul", riesgo:"moderado", nota:"Colorante sintético; absorbido parcialmente por el tracto digestivo. IDA 6 mg/kg según EFSA.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e150d":{ nombre:"Caramelo sulfito amónico", funcion:"Colorante caramelo (gaseosas)", riesgo:"moderado", nota:"Usado en gaseosas tipo cola. Contiene 4-metilimidazol (4-MEI), clasificado como posible carcinógeno (IARC 2B). California lo lista en la Prop. 65.", fuente:"https://www.efsa.europa.eu/en/efsajournal/pub/2004" },
  "e202":  { nombre:"Sorbato de potasio", funcion:"Conservante", riesgo:"bajo", nota:"Conservante antimicrobiano de amplio uso. Considerado seguro por JECFA/EFSA dentro de la IDA.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e211":  { nombre:"Benzoato de sodio", funcion:"Conservante", riesgo:"moderado", nota:"En presencia de ácido ascórbico (E300) puede formar benceno, un carcinógeno. Muy común en gaseosas y jugos envasados colombianos.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e220":  { nombre:"Dióxido de azufre", funcion:"Conservante / antioxidante", riesgo:"moderado", nota:"Sulfito: puede desencadenar crisis asmáticas en personas sensibles. Declaración obligatoria como alérgeno.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e250":  { nombre:"Nitrito de sodio", funcion:"Conservante cárnico", riesgo:"alto", nota:"Usado en embutidos. Puede formar nitrosaminas (carcinógenos IARC 2A). La EFSA confirmó seguridad en niveles actuales, pero la IARC clasifica la carne procesada como carcinógena (grupo 1).", fuente:"https://www.iarc.who.int/news-events/iarc-monographs-evaluate-consumption-of-red-meat-and-processed-meat/" },
  "e251":  { nombre:"Nitrato de sodio", funcion:"Conservante cárnico", riesgo:"moderado", nota:"Se convierte en nitrito en el organismo; mismas precauciones que el E250 en embutidos.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e300":  { nombre:"Ácido ascórbico (vitamina C)", funcion:"Antioxidante", riesgo:"bajo", nota:"Vitamina C usada como antioxidante. Seguro; evitar combinación con benzoatos en bebidas.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e320":  { nombre:"BHA (butilhidroxianisol)", funcion:"Antioxidante", riesgo:"alto", nota:"Antioxidante sintético de grasas. La IARC lo clasifica como posible carcinógeno humano (2B). Común en papas fritas y snacks.", fuente:"https://monographs.iarc.who.int/list-of-classifications" },
  "e321":  { nombre:"BHT (butilhidroxitolueno)", funcion:"Antioxidante", riesgo:"moderado", nota:"Antioxidante sintético común en empaques y snacks. La EFSA lo reevaluó con IDA reducida; en revisión por efectos hormonales.", fuente:"https://www.efsa.europa.eu/en/efsajournal/pub/2588" },
  "e322":  { nombre:"Lecitina (soya/girasol)", funcion:"Emulsionante", riesgo:"bajo", nota:"Emulsionante natural. La de soya es alérgeno de declaración obligatoria.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e330":  { nombre:"Ácido cítrico", funcion:"Acidulante", riesgo:"bajo", nota:"Acidulante de amplio uso; considerado seguro.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e338":  { nombre:"Ácido fosfórico", funcion:"Acidulante (gaseosas)", riesgo:"moderado", nota:"Aporta carga de fosfatos; el exceso dietético de fosfato se asocia con riesgo cardiovascular y óseo según la EFSA.", fuente:"https://www.efsa.europa.eu/en/press/news/190712a" },
  "e407":  { nombre:"Carragenina", funcion:"Espesante / gelificante", riesgo:"moderado", nota:"Espesante de algas. Estudios sugieren posible inflamación intestinal; la EFSA mantiene su evaluación bajo observación.", fuente:"https://www.efsa.europa.eu/en/efsajournal/pub/5238" },
  "e412":  { nombre:"Goma guar", funcion:"Espesante", riesgo:"bajo", nota:"Fibra vegetal; segura dentro de usos autorizados.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e415":  { nombre:"Goma xantana", funcion:"Espesante / estabilizante", riesgo:"bajo", nota:"Polisacárido fermentado; considerado seguro por la EFSA.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e420":  { nombre:"Sorbitol", funcion:"Edulcorante / humectante", riesgo:"moderado", nota:"Polialcohol: efecto laxante en consumo elevado (advertencia obligatoria). Común en chicles y golosinas 'sin azúcar'.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e421":  { nombre:"Manitol", funcion:"Edulcorante", riesgo:"moderado", nota:"Polialcohol con efecto laxante en dosis altas.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e433":  { nombre:"Polisorbato 80", funcion:"Emulsionante", riesgo:"debate", nota:"Estudios en animales lo vinculan con alteraciones de la microbiota intestinal; la EFSA lo reevalúa.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e450":  { nombre:"Difosfatos", funcion:"Regulador de acidez", riesgo:"moderado", nota:"Fosfato añadido: la EFSA fijó IDA grupal de 40 mg/kg por preocupación cardiovascular.", fuente:"https://www.efsa.europa.eu/en/press/news/190712a" },
  "e451":  { nombre:"Trifosfatos", funcion:"Conservante / regulador", riesgo:"moderado", nota:"Fosfato añadido; ver E450.", fuente:"https://www.efsa.europa.eu/en/press/news/190712a" },
  "e452":  { nombre:"Polifosfatos", funcion:"Estabilizante", riesgo:"moderado", nota:"Fosfato añadido; ver E450.", fuente:"https://www.efsa.europa.eu/en/press/news/190712a" },
  "e471":  { nombre:"Mono- y diglicéridos de ácidos grasos", funcion:"Emulsionante", riesgo:"bajo", nota:"Emulsionante de grasas; la EFSA lo considera sin preocupación en usos actuales.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e475":  { nombre:"Poliglicerol polirricinoleato (PGPR)", funcion:"Emulsionante (chocolates)", riesgo:"bajo", nota:"Reduce manteca de cacao en chocolates económicos; seguro en IDA.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e476":  { nombre:"Polirricinoleato de poliglicerol", funcion:"Emulsionante", riesgo:"bajo", nota:"Usado en coberturas de chocolate; seguro en IDA.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e500":  { nombre:"Bicarbonato de sodio", funcion:"Gasificante", riesgo:"bajo", nota:"Gasificante común en panadería; seguro.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e621":  { nombre:"Glutamato monosódico (MSG)", funcion:"Potenciador de sabor", riesgo:"moderado", nota:"Muy usado en papas y snacks. La EFSA fijó IDA de 30 mg/kg (2017) por posibles efectos en dosis altas; el 'síndrome del restaurante chino' no fue confirmado, pero se recomienda moderación.", fuente:"https://www.efsa.europa.eu/en/press/news/170712" },
  "e627":  { nombre:"Guanilato disódico", funcion:"Potenciador de sabor", riesgo:"moderado", nota:"Suele acompañar al MSG; personas con gota deben moderarlo (purinas).", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e631":  { nombre:"Inosinato disódico", funcion:"Potenciador de sabor", riesgo:"moderado", nota:"Potenciador común en snacks; precaución en gota y hiperuricemia.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e635":  { nombre:"Ribonucleótidos disódicos", funcion:"Potenciador de sabor", riesgo:"moderado", nota:"Combinación de E627+E631; mismo perfil de precaución.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e950":  { nombre:"Acesulfamo K", funcion:"Edulcorante", riesgo:"debate", nota:"Edulcorante intenso. La Resolución 2492 de 2022 exige sello frontal 'CONTIENE EDULCORANTES' en Colombia. Estudios recientes cuestionan efectos metabólicos a largo plazo.", fuente:"https://www.minsalud.gov.co/Ministerio/Institucional/Proceso%20participativo/Resoluci%C3%B3n%202492%20de%202022.pdf" },
  "e951":  { nombre:"Aspartamo", funcion:"Edulcorante", riesgo:"debate", nota:"En 2023 la IARC lo clasificó como 'posiblemente carcinógeno' (2B) mientras JECFA mantuvo la IDA de 40 mg/kg. No apto para fenilcetonúricos. En Colombia exige sello frontal de edulcorantes.", fuente:"https://www.who.int/news/item/14-07-2023-aspartame-hazard-and-risk-assessment-results-released" },
  "e952":  { nombre:"Ciclamato", funcion:"Edulcorante", riesgo:"moderado", nota:"Prohibido en EE. UU. desde 1969; autorizado en la UE y Colombia con límites.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e954":  { nombre:"Sacarina", funcion:"Edulcorante", riesgo:"moderado", nota:"Edulcorante histórico; retirado de listas de carcinógenos en 2000, pero con IDA establecida (5 mg/kg).", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e955":  { nombre:"Sucralosa", funcion:"Edulcorante", riesgo:"debate", nota:"La OMS desaconsejó en 2023 el uso de edulcorantes sin azúcar para control de peso por posibles efectos metabólicos. Sello frontal obligatorio en Colombia.", fuente:"https://www.who.int/news/item/15-05-2023-who-advises-not-to-use-non-sugar-sweeteners-for-weight-control-in-newly-released-guideline" },
  "e960":  { nombre:"Glucósidos de esteviol (stevia)", funcion:"Edulcorante natural", riesgo:"bajo", nota:"Edulcorante de origen vegetal; IDA 4 mg/kg. Aun así requiere sello frontal de edulcorante en Colombia.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e967":  { nombre:"Xilitol", funcion:"Edulcorante", riesgo:"moderado", nota:"Polialcohol con efecto laxante; altamente tóxico para perros (precaución en hogares con mascotas).", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" },
  "e1442":{ nombre:"Almidón modificado (hidroxipropil)", funcion:"Espesante", riesgo:"bajo", nota:"Almidón modificado común en salsas y lácteos; seguro en usos autorizados.", fuente:"https://www.efsa.europa.eu/en/topics/topic/food-additives" }
};

const RISK_LABEL = { bajo:"Riesgo bajo", moderado:"Riesgo moderado", alto:"Precaución alta", debate:"En debate científico", desconocido:"Sin ficha" };

/* Categorías rápidas de canasta familiar (tags de Open Food Facts) */
const QUICK_CATEGORIES = [
  { label:"Golosinas", tag:"en:confectioneries" },
  { label:"Papas y snacks", tag:"en:crisps" },
  { label:"Leches", tag:"en:milks" },
  { label:"Bebidas azucaradas", tag:"en:sweetened-beverages" },
  { label:"Gaseosas", tag:"en:sodas" },
  { label:"Galletas", tag:"en:biscuits" },
  { label:"Chocolates", tag:"en:chocolates" },
  { label:"Cereales de caja", tag:"en:breakfast-cereals" },
  { label:"Yogures", tag:"en:yogurts" },
  { label:"Embutidos", tag:"en:processed-meats" },
  { label:"Panadería empacada", tag:"en:breads" },
  { label:"Salsas", tag:"en:sauces" }
];

/* Sellos de advertencia frontal — Resolución 2492 de 2022 (MinSalud).
   Umbrales implementados (alimentos sólidos, por 100 g; líquidos por 100 ml).
   Aproximación educativa basada en la tabla de la resolución. */
const SELLOS_RULES = [
  { id:"azucares",    sello:"EXCESO DE AZÚCARES",       solidoG:10,  liquidoG:5,    nutriente:"sugars_100g" },
  { id:"saturadas",   sello:"EXCESO DE GRASAS SATURADAS", solidoG:4, liquidoG:3,    nutriente:"saturated-fat_100g" },
  { id:"trans",       sello:"EXCESO DE GRASAS TRANS",    solidoG:0.1,liquidoG:0.1,  nutriente:"trans-fat_100g", min:true },
  { id:"sodio",       sello:"EXCESO DE SODIO",           solidoMg:500,liquidoMg:40, nutriente:"sodium_100g", factor:1000 }, // sodium g→mg
  { id:"calorias",    sello:"EXCESO DE CALORÍAS",        solidoKcal:300, liquidoKcal:70, nutriente:"energy-kcal_100g" }
];

/* Normativas colombianas reales y vigentes (referencia estable) */
const NORMATIVAS = [
  { titulo:"Resolución 2492 de 2022 — Etiquetado frontal de advertencia", entidad:"Ministerio de Salud", anio:"2022",
    resumen:"Establece los sellos octogonales 'EXCESO DE…' para azúcares, grasas saturadas, grasas trans, sodio y calorías, y las leyendas sobre edulcorantes y cafeína en alimentos empacados.",
    url:"https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/DIJ/resolucion-2492-de-2022.pdf" },
  { titulo:"Ley 2120 de 2021 — Promoción de entornos saludables", entidad:"Congreso de la República", anio:"2021",
    resumen:"Conocida como 'ley de comida chatarra': regula la publicidad de alimentos ultraprocesados dirigida a menores y su venta en entornos educativos.",
    url:"https://www.minsalud.gov.co/Ministerio/Institucional/Proceso%20participativo/ley-2120-de-2021.pdf" },
  { titulo:"Resolución 810 de 2021 — Rotulado nutricional y frontal", entidad:"Ministerio de Salud", anio:"2021",
    resumen:"Define los requisitos de rotulado nutricional, declarativo y frontal que deben cumplir los alimentos empacados para consumo humano en Colombia.",
    url:"https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/DIJ/resolucion-810-de-2021.pdf" },
  { titulo:"Decreto 3075 de 1997 — Buenas prácticas de manufactura", entidad:"Ministerio de Salud", anio:"1997",
    resumen:"Norma base que regula la producción, procesamiento y comercialización de alimentos en Colombia; sustento del sistema de inspección del INVIMA.",
    url:"https://www.invima.gov.co" },
  { titulo:"Resolución 5109 de 2005 — Registro sanitario de alimentos", entidad:"Ministerio de Protección Social", anio:"2005",
    resumen:"Establece el régimen de registros sanitarios, permisos y notificaciones sanitarias obligatorias para alimentos, materias primas y aditivos.",
    url:"https://www.invima.gov.co" }
];

/* Portales oficiales y de vigilancia para noticias/alertas */
const NEWS_SOURCES = [
  { nombre:"INVIMA — Alertas sanitarias", desc:"Alertas oficiales sobre alimentos retirados, fraudes y productos incumplidos en Colombia.", url:"https://www.invima.gov.co/alertas-sanitarias", tipo:"oficial" },
  { nombre:"INVIMA — Sala de prensa", desc:"Comunicados y boletines del instituto sobre vigilancia de alimentos y bebidas.", url:"https://www.invima.gov.co/sala-de-prensa", tipo:"oficial" },
  { nombre:"MinSalud — Nutrición y alimentación", desc:"Normativas y lineamientos de etiquetado, entornos saludables y seguridad alimentaria.", url:"https://www.minsalud.gov.co", tipo:"oficial" },
  { nombre:"SIC — Superintendencia de Industria y Comercio", desc:"Sanciones a empresas por publicidad engañosa y protección del consumidor.", url:"https://www.sic.gov.co/tema/proteccion-del-consumidor", tipo:"oficial" },
  { nombre:"datos.gov.co — Datasets del INVIMA", desc:"Todos los conjuntos de datos abiertos publicados por el INVIMA (registros, establecimientos, certificados).", url:"https://www.datos.gov.co/browse?limitTo=datasets&q=invima", tipo:"datos" },
  { nombre:"Open Food Facts", desc:"Base colaborativa mundial de alimentos: ingredientes, Nutri-Score, NOVA y sellos.", url:"https://co.openfoodfacts.org", tipo:"datos" },
  { nombre:"OPS/OMS — Alimentación saludable", desc:"Contexto regional sobre ultraprocesados, etiquetado frontal y perfil de nutrientes.", url:"https://www.paho.org/es/temas/nutricion", tipo:"oficial" }
];

/* Contenido del ticker */
const TICKER_ITEMS = [
  "<b>RES. 2492/2022</b> — Sellos frontales de advertencia obligatorios en alimentos empacados",
  "<b>LEY 2120/2021</b> — Restricciones a publicidad de ultraprocesados para menores",
  "<b>INVIMA</b> — Verifica el registro sanitario antes de comprar: RSA (alimentos) · NSI (bebidas)",
  "<b>NOVA 4</b> — Ultraprocesados: formulaciones industriales con aditivos y pocos alimentos enteros",
  "<b>EFSA</b> — Colorantes azoicos E102/E110/E122/E124/E129 bajo vigilancia por hiperactividad infantil",
  "<b>OMS 2023</b> — No recomienda edulcorantes libres de calorías para control de peso",
  "<b>DATOS.GOV.CO</b> — Registros sanitarios y conceptos de inspección del INVIMA en datos abiertos"
];

/* Enlaces externos útiles para fichas de empresa */
const EXTERNAL_LINKS = {
  invimaConsulta: "https://www.invima.gov.co",
  sic: "https://www.sic.gov.co",
  datosAbiertos: "https://www.datos.gov.co",
  camaras: "https://www.rues.org.co"
};
