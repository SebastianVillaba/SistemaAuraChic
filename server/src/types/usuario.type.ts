export interface CrearUsuarioRequest {
    idPersona: number;
    username: string;
    password: string;
    idRol: number;
    idUsuarioAlta: number;
}

export interface ModificarUsuarioRequest {
    idUsuario: number;
    username: string;
    password?: string;
    idRol: number;
    activo: number;
}

export interface Usuario {
    idUsuario: number;
    username: string;
    nombreCompleto: string;
    nombreRol: string;
    estado: string;
}

export interface UsuarioDetalle {
    idUsuario: number;
    username: string;
    idRol: number;
    nombreRol: string;
    activo: boolean;
    idPersona: number;
    nombrePersona: string;
    ruc: string;
}
