export interface Caja {
  idCaja: number;
  nombreCaja: string;
  activo: boolean;
  estadoCaja: boolean; // false = cerrada, true = abierta
}

export interface MovimientoCaja {
  idMovimientoCaja: number;
  fechaApertura: string;
  fechaCierre: string | null;
}

export interface ArqueoCajaTmpItem {
  idArqueoTmp: number;
  idDenominacion: number;
  nombreBillete: string;
  valor: number;
  cantidad: number;
  subtotal: number;
}

export interface GastoCajaTmpItem {
  idGastoCajaTmp: number;
  concepto: string;
  montoGasto: number;
  factura: number;
  fechaRegistro?: string;
}

export interface EstadoCaja {
  estadoCaja: boolean;
  idMovimientoCaja?: number;
  nroCaja?: number;
}

export interface TarjetaDebito {
  idTarjetaDebito: number;
  nombreTarjetaDebito: string;
}

export interface Moneda {
  idMoneda: number;
  nombre: string;
  simbolo: string;
  cotizacion: number;
  activo: boolean;
}

export interface DetArqueoTarjetaCreditoTmp {
  nro: number;
  nombreTarjetaDebito: string;
  idTarjetaDebito: number;
  monto: number;
}

export interface DetArqueoTarjetaDebitoTmp {
  nro: number;
  nombreTarjetaDebito: string;
  idTarjetaDebito: number;
  monto: number;
}

export interface DetArqueoTransferenciaTmp {
  nro: number;
  concepto: string;
  monto: number;
}

export interface DetArqueoMonedaTmp {
  nro: number;
  idMoneda: number;
  nombre: string;
  montoMoneda: number;
  total: number;
}


