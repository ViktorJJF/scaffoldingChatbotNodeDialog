//==============================================
//===========Algoritmo de Levenshtain===========
//==============================================

let weights = [];
let MaxPercentWord = [];
//Position 0 : Percent ------- Position 1: Word


entries = [{
        value: 'Adecuación al nuevo plan de estudios',
        synonym: ['Adecuación al nuevo plan de estudios']
    },
    {
        value: 'Admisión para personas con Discapacidad',
        synonym: ['Admisión para personas con Discapacidad']
    },
    {
        value: 'Admisión por 1er o 2do Puesto de Educación Secundaria',
        synonym: ['Admisión por 1er o 2do Puesto de Educación Secundaria']
    },
    {
        value: 'Admisión por el Ingreso del Centro Pre Universitario',
        synonym: ['Admisión por el Ingreso del Centro Pre Universitario']
    },
    {
        value: 'ADMISIÓN POR GRADO O TÍTULO PROFESIONAL UNIVERSITARIO',
        synonym: ['ADMISIÓN POR GRADO O TÍTULO PROFESIONAL UNIVERSITARIO']
    },
    {
        value: 'Admisión por Reanudación de Estudios',
        synonym: ['Admisión por Reanudación de Estudios']
    },
    {
        value: 'Admisión por ser Deportista Calificado',
        synonym: ['Admisión por ser Deportista Calificado']
    },
    {
        value: 'ADMISIÓN POR TÍTULO DE INSTITUTO DE EDUCACIÓN SUPERIOR NO UNIVERSITARIO',
        synonym: ['ADMISIÓN POR TÍTULO DE INSTITUTO DE EDUCACIÓN SUPERIOR NO UNIVERSITARIO']
    },
    {
        value: 'Admisión por Traslado Externo',
        synonym: ['Admisión por Traslado Externo', 'traslado de otra universidad', 'traslado externo']
    },
    {
        value: 'Admisión por Traslado Interno',
        synonym: ['Admisión por Traslado Interno', 'traslado interno']
    },
    {
        value: 'Ampliación de Créditos',
        synonym: ['Ampliación de Créditos']
    },
    {
        value: 'anulación de deuda',
        synonym: ['anulación de deuda']
    },
    {
        value: 'autenticación de documentos',
        synonym: ['autenticación de documentos']
    },
    {
        value: 'Beca por ayudantía de cátedra',
        synonym: ['Beca por ayudantía de cátedra']
    },
    {
        value: 'Beca por ayudantía de investigación',
        synonym: ['Beca por ayudantía de investigación']
    },
    {
        value: 'Beca por casos especiales (orfandad/ discapacidad)',
        synonym: ['Beca por casos especiales (orfandad/ discapacidad)']
    },
    {
        value: 'Beca por hermanos estudiantes',
        synonym: ['Beca por hermanos estudiantes']
    },
    {
        value: 'Beca por padre e hijo estudiantes',
        synonym: ['Beca por padre e hijo estudiantes']
    },
    {
        value: 'Beca por Precariedad Económica',
        synonym: ['Beca por Precariedad Económica']
    },
    {
        value: 'Beca por promedio ponderado acumulativo',
        synonym: ['Beca por promedio ponderado acumulativo']
    },
    {
        value: 'Beca por representar a la Universidad en evento deportivo',
        synonym: ['Beca por representar a la Universidad en evento deportivo']
    },
    {
        value: 'Beca por Retiro Voluntario, de Jubilación o Fallecimiento del Docente Ordinario o del Personal Administrativo Indeterminado de la Universidad',
        synonym: ['Beca por Retiro Voluntario, de Jubilación o Fallecimiento del Docente Ordinario o del Personal Administrativo Indeterminado de la Universidad']
    },
    {
        value: 'Beca por ser Cónyuges estudiantes',
        synonym: ['Beca por ser Cónyuges estudiantes']
    },
    {
        value: 'Beca por ser hijo de docente o trabajador administrativo de la Universidad',
        synonym: ['Beca por ser hijo de docente o trabajador administrativo de la Universidad']
    },
    {
        value: 'Beca por tres primeros puestos en el examen de admisión',
        synonym: ['Beca por tres primeros puestos en el examen de admisión']
    },
    {
        value: 'Boleta de notas',
        synonym: ['Boleta de notas']
    },
    {
        value: 'Búsqueda de Documentos',
        synonym: ['Búsqueda de Documentos']
    },
    {
        value: 'Cambio de Filial',
        synonym: ['Cambio de Filial']
    },
    {
        value: 'Cambio de Modalidad',
        synonym: ['Cambio de Modalidad']
    },
    {
        value: 'cambio de nombre y apellido por mandato judicial',
        synonym: ['cambio de nombre y apellido por mandato judicial']
    },
    {
        value: 'Carné de Biblioteca',
        synonym: ['Carné de Biblioteca']
    },
    {
        value: 'Carta de Presentación',
        synonym: ['Carta de Presentación', 'practicas pre profesionales', 'practicas profesionales', 'autarizacion de practica']
    },
    {
        value: 'Carta de Presentación de Internado',
        synonym: ['Carta de Presentación de Internado']
    },
    {
        value: 'Certificado de Estudio',
        synonym: ['Certificado de Estudio']
    },
    {
        value: 'Certificado de Estudios del Centro de Idiomas',
        synonym: ['Certificado de Estudios del Centro de Idiomas']
    },
    {
        value: 'Conformidad de Documentos',
        synonym: ['Conformidad de Documentos']
    },
    {
        value: 'Constancia Biblioteca',
        synonym: ['Constancia Biblioteca']
    },
    {
        value: 'Constancia de Conducta',
        synonym: ['Constancia de Conducta']
    },
    {
        value: 'Constancia de Egresado',
        synonym: ['Constancia de Egresado']
    },
    {
        value: 'Constancia de Estudios',
        synonym: ['Constancia de Estudios']
    },
    {
        value: 'Constancia de Estudios del Centro de Idiomas',
        synonym: ['Constancia de Estudios del Centro de Idiomas']
    },
    {
        value: 'Constancia de Internado',
        synonym: ['Constancia de Internado']
    },
    {
        value: 'Constancia de Matrícula',
        synonym: ['Constancia de Matrícula']
    },
    {
        value: 'Constancia de Modalidad de estudios',
        synonym: ['Constancia de Modalidad de estudios']
    },
    {
        value: 'Constancia de No adeudo',
        synonym: ['Constancia de No adeudo']
    },
    {
        value: 'Constancia de No Adeudo de la Clínica Odontológica',
        synonym: ['Constancia de No Adeudo de la Clínica Odontológica']
    },
    {
        value: 'Constancia de orden de mérito',
        synonym: ['Constancia de orden de mérito']
    },
    {
        value: 'Constancia de Promedio Ponderado',
        synonym: ['Constancia de Promedio Ponderado']
    },
    {
        value: 'Constancia Económica',
        synonym: ['Constancia Económica']
    },
    {
        value: 'Constancia por Tercio y Quinto Superior',
        synonym: ['Constancia por Tercio y Quinto Superior']
    },
    {
        value: 'Convalidación de Cursos',
        synonym: ['Convalidación de Cursos']
    },
    {
        value: 'Corrección de Nombres y/o Apellidos',
        synonym: ['Corrección de Nombres y/o Apellidos', 'cambio de nombres', 'cambio de apellidos', 'correcion de nombres', 'correcion de apellidos']
    },
    {
        value: 'Curso Autofinanciado',
        synonym: ['Curso Autofinanciado']
    },
    {
        value: 'Curso Autofinanciado cuando falta 01 ó 02 cursos para culminar la Carrera',
        synonym: ['Curso Autofinanciado cuando falta 01 ó 02 cursos para culminar la Carrera']
    },
    {
        value: 'Constancia por Tercio y Quinto Superior',
        synonym: ['Constancia por Tercio y Quinto Superior']
    },
    {
        value: 'Curso Paralelo',
        synonym: ['Curso Paralelo']
    },
    {
        value: 'Diploma de Egresado en Auxiliar en Educación',
        synonym: ['Diploma de Egresado en Auxiliar en Educación']
    },
    {
        value: 'Duplicado de Certificado de Estudio',
        synonym: ['Duplicado de Certificado de Estudio']
    },
    {
        value: 'Duplicado de Constancia de Ingreso',
        synonym: ['Duplicado de Constancia de Ingreso']
    },
    {
        value: 'Duplicado de Ficha de Matrícula',
        synonym: ['Duplicado de Ficha de Matrícula']
    },
    {
        value: 'Duplicado de Recibo',
        synonym: ['Duplicado de Recibo']
    },
    {
        value: 'examen de aplazados',
        synonym: ['examen de aplazados']
    },
    {
        value: 'Examen de rezagados',
        synonym: ['Examen de rezagados']
    },
    {
        value: 'Examen de Suficiencia pregrado',
        synonym: ['Examen de Suficiencia pregrado', 'examen de insuficiencia']
    },
    {
        value: 'Examen de Ubicación',
        synonym: ['Examen de Ubicación']
    },
    {
        value: 'Grado de Bachiller',
        synonym: ['Grado de Bachiller']
    },
    {
        value: 'INSCRIPCIÓN POR EL CENTRO PRE UNIVERSITARIO',
        synonym: ['INSCRIPCIÓN POR EL CENTRO PRE UNIVERSITARIO']
    },
    {
        value: 'llevar curso en otra escuela',
        synonym: ['llevar curso en otra escuela']
    },
    {
        value: 'matrícula con proforma académica',
        synonym: ['matrícula con proforma académica']
    },
    {
        value: 'Matrícula Especial',
        synonym: ['Matrícula Especial']
    },
    {
        value: 'Matrícula Especial por Cuarta Matrícula',
        synonym: ['Matrícula Especial por Cuarta Matrícula']
    },
    {
        value: 'Matrícula Virtual',
        synonym: ['Matrícula Virtual']
    },
    {
        value: 'Proceso de Admisión',
        synonym: ['Proceso de Admisión']
    },
    {
        value: 'Reanudación de Estudios',
        synonym: ['Reanudación de Estudios']
    },
    {
        value: 'Record Académico',
        synonym: ['Record Académico']
    },
    {
        value: 'Reserva de Matrícula',
        synonym: ['Reserva de Matrícula']
    },
    {
        value: 'Retiro e Inclusión de Cursos',
        synonym: ['Retiro e Inclusión de Cursos', 'cambio de seccion', 'inclusion de curso', 'retiro de curso', 'dejar un curso']
    },
    {
        value: 'Solicitud de Sílabos',
        synonym: ['Solicitud de Sílabos']
    },
    {
        value: 'Solicitud de Sílabos para Auxiliar en Educación',
        synonym: ['Solicitud de Sílabos para Auxiliar en Educación']
    },
    {
        value: 'Título profesional',
        synonym: ['Título profesional', 'titulo']
    },
    {
        value: 'transferencia de dinero',
        synonym: ['transferencia de dinero']
    },
    {
        value: 'tratamientos clínicos',
        synonym: ['tratamientos clínicos']
    },
    {
        value: 'Justificación de Inasistencia',
        synonym: ['Justificación de Inasistencia']
    },
    {
        value: 'Llevar Curso en otro Plan de Estudios',
        synonym: ['Llevar Curso en otro Plan de Estudios']
    },
    {
        value: 'Fraccionamiento de Deuda',
        synonym: ['Fraccionamiento de Deuda']
    },
    {
        value: 'Reubicación de Actividad Integradora',
        synonym: ['Reubicación de Actividad Integradora']
    },
    {
        value: 'Cambio y Reseteo de Clave',
        synonym: ['Cambio y Reseteo de Clave']
    },
    {
        value: 'Fraccionamiento de Deuda',
        synonym: ['Resolución Prácticas']
    }
]

let collection = [
    'Adecuación al nuevo plan de estudios',
    'Admisión para personas con Discapacidad',
    'Admisión por 1er o 2do Puesto de Educación Secundaria',
    'Admisión por el Ingreso del Centro Pre Universitario',
    'ADMISIÓN POR GRADO O TÍTULO PROFESIONAL UNIVERSITARIO',
    'Admisión por Reanudación de Estudios',
    'Admisión por ser Deportista Calificado',
    'ADMISIÓN POR TÍTULO DE INSTITUTO DE EDUCACIÓN SUPERIOR NO UNIVERSITARIO',
    'Admisión por Traslado Externo',
    'Admisión por Traslado Interno',
    'Ampliación de Créditos',
    'anulación de deuda',
    'autenticación de documentos',
    'Beca por ayudantía de cátedra',
    'Beca por ayudantía de investigación',
    'Beca por casos especiales (orfandad/ discapacidad)',
    'Beca por hermanos estudiantes',
    'Beca por padre e hijo estudiantes',
    'Beca por Precariedad Económica',
    'Beca por promedio ponderado acumulativo',
    'Beca por representar a la Universidad en evento deportivo',
    'Beca por Retiro Voluntario, de Jubilación o Fallecimiento del Docente Ordinario o del Personal Administrativo Indeterminado de la Universidad',
    'Beca por ser Cónyuges estudiantes',
    'Beca por ser hijo de docente o trabajador administrativo de la Universidad',
    'Beca por tres primeros puestos en el examen de admisión',
    'Boleta de notas',
    'Búsqueda de Documentos',
    'Cambio de Filial',
    'Cambio de Modalidad',
    'cambio de nombre y apellido por mandato judicial',
    'Carné de Biblioteca',
    'Carta de Presentación',
    'Carta de Presentación de Internado',
    'Certificado de Estudio',
    'Certificado de Estudios del Centro de Idiomas',
    'Conformidad de Documentos',
    'Constancia Biblioteca',
    'Constancia de Conducta ',
    'Constancia de Egresado',
    'Constancia de Estudios',
    'Constancia de Estudios del Centro de Idiomas',
    'Constancia de Internado',
    'Constancia de Matrícula',
    'Constancia de Modalidad de estudios',
    'Constancia de No adeudo',
    'Constancia de No Adeudo de la Clínica Odontológica',
    'Constancia de orden de mérito',
    'Constancia de Promedio Ponderado',
    'Constancia Económica',
    'Constancia por Tercio y Quinto Superior',
    'Convalidación de Cursos',
    'Corrección de Nombres y/o Apellidos',
    'Curso Autofinanciado',
    'Curso Autofinanciado cuando falta 01 ó 02 cursos para culminar la Carrera',
    'Curso Paralelo',
    'Diploma de Egresado en Auxiliar en Educación',
    'Duplicado de Certificado de Estudio',
    'Duplicado de Constancia de Ingreso',
    'Duplicado de Ficha de Matrícula',
    'Duplicado de Recibo',
    'examen de aplazados',
    'Examen de rezagados',
    'Examen de Suficiencia pregrado',
    'Examen de Ubicación',
    'Grado de Bachiller',
    'INSCRIPCIÓN POR EL CENTRO PRE UNIVERSITARIO',
    'llevar curso en otra escuela',

    'matrícula con proforma académica',

    'Matrícula Especial',

    'Matrícula Especial por Cuarta Matrícula',

    'Matrícula Virtual',

    'Proceso de Admisión',

    'Reanudación de Estudios',

    'Record Académico',

    'Reserva de Matrícula',

    'Retiro e Inclusión de Cursos',

    'Solicitud de Sílabos',

    'Solicitud de Sílabos para Auxiliar en Educación',

    'Título profesional',

    'transferencia de dinero',

    'tratamientos clínicos',
    'Justificación de Inasistencia',
    'Llevar Curso en otro Plan de Estudios',
    'Fraccionamiento de Deuda',
    'Reubicación de Actividad Integradora',
    'Cambio y Reseteo de Clave',
    'Resolución Prácticas'

]

const applyLevenshtein = (strg1, callback) => {
    var k = 0;
    for (let i = 0; i < entries.length; i++) {
        for (let j = 0; j < entries[i].synonym.length; j++) {
            weights[k] = similarity(strg1, entries[i].synonym[j]);
            if (k == 0) {
                MaxPercentWord[0] = weights[k];
                MaxPercentWord[1] = entries[i].value;
            } else if (weights[k] > MaxPercentWord[0]) {
                MaxPercentWord[0] = weights[k];
                MaxPercentWord[1] = entries[i].value;
            }
            k = k + 1;
        }
    }
    console.log(`Palabra encontrada: ${MaxPercentWord}`);
    callback(MaxPercentWord[1]);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i < s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return (costs[s2.length]);
}

function similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    let percent = (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
    //console.log(s1 + ' y ' + s2 + ' es:               ' + percent);
    return percent;
}

applyLevenshtein('mi adecuacion', (res) => {

});

module.exports = {
    applyLevenshtein
}