import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AlertController, Platform } from '@ionic/angular';
import { Html5Qrcode } from 'html5-qrcode';
import { Geolocation } from '@capacitor/geolocation'; 

@Component({
  selector: 'app-codigo-alumno-qr',
  templateUrl: './codigo-alumno-qr.page.html',
  styleUrls: ['./codigo-alumno-qr.page.scss'],
})
export class CodigoAlumnoQrPage implements OnInit {
  isSupported = false;
  barcodes: Barcode[] = [];
  scannerId = 'reader'; // EN ESTE CONTENEDOR, PUEDES SCANEAR EL "QR" DEL NAGEDADOR
  html5QrCode: Html5Qrcode | null = null;

  latitud:number;
  longitud:number;

  // AQUI ESTAN LAS VARIABLES PARA GEO
  latitudProfesor: string;
  longitudProfesor: string;
  latitudProfesorNum: number;
  longitudProfesorNum: number;
//ARREGLAR ESTO DE AQUI ABAJO, DA ERROR.
  latitudEstudiante: number;
  longitudEstudiante: number;
  distanciaEnMetros: number;

  //CONSTRUCTOR
  constructor(private alertController: AlertController, private platform: Platform) {}

   async obtenerCoordenadas(){
    const obtenerCoordenadas=await Geolocation.getCurrentPosition();
    this.latitud=obtenerCoordenadas.coords.latitude;
    this.longitud=obtenerCoordenadas.coords.longitude;
   }


  //AQUI ABAJO PUEDES COMPROBAR SI TODO ESTA FUNCIONANDO OK CON EL IONIC, Y DENTRO DEL ENTORNO "THEN" SE COMPRUEBA -
  //SI TODO FUNCIONA OK
  ngOnInit() {
    this.platform.ready().then(async () => {
      if (this.platform.is('capacitor')) {
        const result = await BarcodeScanner.isSupported();
        this.isSupported = result.supported;
      } else {
        this.html5QrCode = new Html5Qrcode(this.scannerId);
        this.isSupported = true;
      }
    });
  }

  //AQUI ABAJO GESTIONA EL PROCESO DE ESCANEOS DE QR
  async scan(): Promise<void> {
    const granted = await this.requestPermissions();
    if (!granted) {
      this.presentAlert();
      return;
    }


////AQUI ESCANEA EL QR DE UNA FORMA OK Y NATIVA, PARA DISPOSITIVOS "CAPACITOR" 
    if (this.platform.is('capacitor') && this.isSupported) {
      const { barcodes } = await BarcodeScanner.scan();
      this.barcodes.push(...barcodes);
    } else if (this.html5QrCode) { 
              //ESTO SE UTILIZA PARA INICIAR EL SCANNER DE LOS CODIGOS QR EN EL NAVEGADOR, USANDO LA BIBLIOTECA "HTML..."
                            //SE ACTIVARA CUANDO NO ESTE EN EL ENTORNO "CAPACITOR" Y EL "HTML..." HAYA SIDO INICIADO
      this.html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 500, height: 500 },
        },
        (decodedText: string) => {
          alert(`codigo QR escaneado: ${decodedText}`);
          this.html5QrCode?.stop();

          //AQUI PROCESAMOS LOS DATOS ESCANEADOS (ARREGLAR)
          const datosRecibidos = decodedText.split(','); //SUPOSICION POR SI LOS DATOS VIENEN SEPRADO POR UNA COMA
          this.obtenerGeolocalizacion(datosRecibidos); 
        },
        //ERROR AL ESCANEAR EL COSO
        (errorMessage: string) => {
          console.error('Error de escaneo:', errorMessage);
        }

        //ERROR AL INICIAR EL SCANNER
      ).catch((err: any) => console.error('Error al iniciar el escaner', err));
    }
  }
//ESTO SOLICITA EL ACCESO A LA CAMARA SI LA APLICACION SE EJECUTA CON EL ENTORNO DEL "CAPACITOR"
//VERIFICA EL ESTADOS DE LOS PERMISOS Y VA A DEVOLVERLOS CON EL "TRUE" 
  async requestPermissions(): Promise<boolean> {
    if (this.platform.is('capacitor')) {
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === 'granted' || camera === 'limited';
    }
    return true; 
  }

//AQUI MOSTRAMOS UN ALERT PARA AVISAR QUE NO DIO LOS PERMISOS PARA USAR LA CAMARA
  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permiso NO concedido',
      message: 'DA EL PERMISO PARA QUE LA CAMARA PUEDA INICIAR EL SCANEO',
      buttons: ['OK'],
    });
    await alert.present();
  }

  // AQUI HACEMOS EL METODO PARA OBTENER LA GEO (longitud, y latitud :p)
  async obtenerGeolocalizacion(datosRecibidos: string[]): Promise<void> {
    this.latitudProfesor = datosRecibidos[5];
    this.longitudProfesor = datosRecibidos[6];

    console.log("Profesor normal obtenido:");
    console.log("Latitud:", this.latitudProfesor, " Tipo: ", typeof this.latitudProfesor);
    console.log("Longitud:", this.longitudProfesor, " Tipo: ", typeof this.longitudProfesor);

    //AQUI HACEMOS LA CONVERSION 
    ////ESTE CODIGO CONVIERTE LAS COORDENADAS DE LA LATITUD Y LA LOGINTUD DEL PROFESOR 
    this.latitudProfesorNum = parseFloat(this.latitudProfesor);
    this.longitudProfesorNum = parseFloat(this.longitudProfesor);
    console.log("Profesor transformado a number:");
    console.log("Latitud: ", this.latitudProfesorNum, " Tipo: ", typeof this.latitudProfesorNum);
    console.log("Longitud: ", this.longitudProfesorNum, " Tipo: ", typeof this.longitudProfesorNum);

    // OBTENEMOS AL ESTUDIANTE
    const position = await Geolocation.getCurrentPosition();
    this.latitudEstudiante = position.coords.latitude;
    this.longitudEstudiante = position.coords.longitude;
    console.log("Estudiante datos:");
    console.log("Latitud:", this.latitudEstudiante, " Tipo: ", typeof this.latitudEstudiante);
    console.log("Longitud:", this.latitudEstudiante, " Tipo: ", typeof this.latitudEstudiante); 

    //AQUI HACEMOS EL METODO QUE BUSCA LOS METROS (ARREGLAR)
    this.distanciaEnMetros = this.haversineDistance(
      this.latitudEstudiante,
      this.longitudEstudiante,
      this.latitudProfesorNum,
      this.longitudProfesorNum
    );
    console.log("Distancia entre los dispositivos: ", this.distanciaEnMetros); //UN PRINT QUE MUESTRE LA DISTANCIA
  }

  //AQUI HACEMOS EL METODO PARA HACER EL CALCULO DE LA DISTANCIA ENTRE PUNTO A Y PUNTO B 
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; //RADIO DE LA TIERRA XD

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c * 1000; //HACEMOS EL RETURN PARA DEVOLVER LA DISTANCIA EN METROS
  }
} 


 /*  import { Component, OnInit } from '@angular/core';
    import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
    import { AlertController, Platform } from '@ionic/angular';
    import { Html5Qrcode } from 'html5-qrcode';
    //import { Geolocation } from '@ionic-native/geolocation/ngx';
    import { Geolocation } from '@capacitor/geolocation';
import { ToastController } from '@ionic/angular';
    
    @Component({
      selector: 'app-codigo-alumno-qr',
      templateUrl: './codigo-alumno-qr.page.html',
      styleUrls: ['./codigo-alumno-qr.page.scss'],
    })
    export class CodigoAlumnoQrPage implements OnInit {
      isSupported = false;
      barcodes: Barcode[] = [];
      scannerId = 'reader'; 
      html5QrCode: Html5Qrcode | null = null;
    
      // Variables para geolocalización
      latitudProfesor: string;
      longitudProfesor: string;
      latitudProfesorNum: number;
      longitudProfesorNum: number;
      latitudEstudiante: number;
      longitudEstudiante: number;
      distanciaEnMetros: number;
    
      constructor(
        private alertController: AlertController,
        private platform: Platform,
        private geolocation: Geolocation,
        private toast:ToastController
      ) {}
    
      ngOnInit() {
        this.platform.ready().then(async () => {
          if (this.platform.is('capacitor')) {
            const result = await BarcodeScanner.isSupported();
            this.isSupported = result.supported;
          } else {
            this.html5QrCode = new Html5Qrcode(this.scannerId);
            this.isSupported = true;
          }
        });
      }
      async mensaje(texto:any){
        const x=await this.toast.create({
          message:texto,
          duration:2000,
          position:'bottom'
        })
        await x.present()
      }
      async scan(): Promise<void> {
        const granted = await this.requestPermissions();
        if (!granted) {
          this.presentAlert();
          return;
        }
    
        if (this.platform.is('capacitor') && this.isSupported) {
          const { barcodes } = await BarcodeScanner.scan();
          this.barcodes.push(...barcodes);
          this.handleScanResult(barcodes);
          this.mensaje("ok entro")
        } else if (this.html5QrCode) { 
          this.html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 500, height: 500 },
            },
            (decodedText: string) => {
              alert(`Código QR escaneado: ${decodedText}`);
              this.html5QrCode?.stop();
              this.handleScanResult([decodedText]);
            },
            (errorMessage: string) => {
              console.error('Error de escaneo:', errorMessage);
            }
          ).catch((err: any) =>{
            console.error('Error al iniciar el escáner', err)
            this.mensaje("error")
            this.mensaje(err)
          } );
        }
      }
    
      async requestPermissions(): Promise<boolean> {
        if (this.platform.is('capacitor')) {
          const { camera } = await BarcodeScanner.requestPermissions();
          return camera === 'granted' || camera === 'limited';
        }
        return true; 
      }
    
      async presentAlert(): Promise<void> {
        const alert = await this.alertController.create({
          header: 'Permiso NO concedido',
          message: 'DA EL PERMISO PARA QUE LA CÁMARA PUEDA INICIAR EL ESCANEO',
          buttons: ['OK'],
        });
        await alert.present();
      }
    
      async handleScanResult(barcodes: (Barcode | string)[]): Promise<void> {
        const decodedData = barcodes[0]; // Obtener el primer código escaneado
        
        try {
          const datosRecibidos = typeof decodedData === 'string' ? JSON.parse(decodedData) : {};
          
          // Asegurarse de que hay suficientes datos
          if (datosRecibidos.latitud && datosRecibidos.longitud) {
            await this.obtenerGeolocalizacion(datosRecibidos);
          } else {
            console.error('Datos recibidos no son válidos o incompletos.');
          }
        } catch (error) {
          console.error('Error al analizar los datos JSON:', error);
        }
      }
    
      // Método para obtener la geolocalización
      async obtenerGeolocalizacion(datosRecibidos: any): Promise<void> {
        this.latitudProfesor = datosRecibidos.latitud;
        this.longitudProfesor = datosRecibidos.longitud;
    
        console.log("Profesor normal obtenido:");
        console.log("Latitud:", this.latitudProfesor, " Tipo: ", typeof this.latitudProfesor);
        console.log("Longitud:", this.longitudProfesor, " Tipo: ", typeof this.latitudProfesor);
    
        // Conversión de las coordenadas
        this.latitudProfesorNum = parseFloat(this.latitudProfesor);
        this.longitudProfesorNum = parseFloat(this.longitudProfesor);
        console.log("Profesor transformado a number:");
        console.log("Latitud: ", this.latitudProfesorNum, " Tipo: ", typeof this.latitudProfesorNum);
        console.log("Longitud: ", this.longitudProfesorNum, " Tipo: ", typeof this.longitudProfesorNum);
    
        // Obtener la posición del estudiante
        const position = await Geolocation.getCurrentPosition();
        this.latitudEstudiante = position.coords.latitude;
        this.longitudEstudiante = position.coords.longitude;
        console.log("Estudiante datos:");
        console.log("Latitud:", this.latitudEstudiante, " Tipo: ", typeof this.latitudEstudiante);
        console.log("Longitud:", this.longitudEstudiante, " Tipo: ", typeof this.longitudEstudiante);
    
        // Calcular la distancia
        this.distanciaEnMetros = this.calcularDistanciaHaversine( //ACA ARREGLAR
          this.latitudEstudiante,
          this.longitudEstudiante,
          this.latitudProfesorNum,
          this.longitudProfesorNum
        );
        console.log("Distancia entre los dispositivos: ", this.distanciaEnMetros);
      }
    
      private calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const aRad = (valor: number) => (valor * Math.PI) / 180; // Función para convertir grados a radianes
        const R = 6371; // Radio de la Tierra en kilómetros
    
        const dLat = aRad(lat2 - lat1); // Diferencia de latitudes en radianes
        const dLon = aRad(lon2 - lon1); // Diferencia de longitudes en radianes
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(aRad(lat1)) * Math.cos(aRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
        return R * c * 1000; // Distancia en metros
    }
    
    } */