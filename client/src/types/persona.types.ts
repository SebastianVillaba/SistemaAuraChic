export interface Persona {
  idPersona?: number;
  nombre: string;
  ruc?: string;
  dv?: string;
  direccion?: string;
  idDepartamento?: number;           // ID del departamento seleccionado
  idDistrito?: number;               // ID del distrito seleccionado
  idCiudad?: string;                 // varchar(30) según el SP
  pais?: string;                     
  telefono?: string;
  celular?: string;
  email?: string;                    
  fechaNacimiento?: string;          
  idUsuarioAlta: number;             
  idTipoDocumento?: number;          
  nombreFantasia?: string;
  apellido?: string;
  codigo?: number;
  idGrupoCliente?: number;           
  tipoPersonaJur: boolean;           
  tipoProveedor: boolean;            
  responsableProveedor?: string;    
  timbrado?: string;                 
  tipoPersonaFis: boolean;           
  tipoPersonaCli: boolean;           
  tipoFuncionario: boolean;
  idSector?: number | null;
}

export interface PersonaFormData extends Persona {}

export interface PersonaSearchParams {
  searchTerm?: string;
  searchBy?: 'nombre' | 'codigo' | 'ruc';
}
