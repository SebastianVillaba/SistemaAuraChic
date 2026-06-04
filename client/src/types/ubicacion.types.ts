// Tipos para ubicaciones (departamentos, distritos, ciudades)

export interface Departamento {
  idDepartamento: number;
  nombre: string;
}

export interface Distrito {
  idDistrito: number;
  nombre: string;
  idDepartamento: number;
}

export interface Ciudad {
  idCiudad: number;
  nombreCiudad: string;
  idDistrito: number;
}
