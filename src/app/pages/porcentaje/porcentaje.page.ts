import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-porcentaje',
  templateUrl: './porcentaje.page.html',
  styleUrls: ['./porcentaje.page.scss'],
})
export class PorcentajePage implements OnInit {

  asignaturas: { nombre: string; porcentaje: number }[] = [];
  asignaturasAdicionales: { nombre: string; porcentaje: number }[] = [
    { nombre: 'Ingles elemental', porcentaje: 0.85 },
    { nombre: 'aplicaciones moviles', porcentaje: 0.65 },
    { nombre: 'consulta de base de datos', porcentaje: 0.90 },
  ];

  constructor(private afs: AngularFirestore) { }

  ngOnInit() {
    this.cargarAsignaturas();
  }

  cargarAsignaturas() {
    this.afs.collection('asignaturas').valueChanges().subscribe((data: any[]) => {
      this.asignaturas = data.map(asignatura => {
        const clasesTotales = asignatura.clasesTotales || 0;
        const clasesAsistidas = asignatura.clasesAsistidas || 0;
        const porcentaje = clasesTotales > 0 ? (clasesAsistidas / clasesTotales) * 100 : 0;

        return {
          nombre: asignatura.nombre,
          porcentaje: porcentaje / 100 // Almacena el porcentaje como decimal
        };
      });
    }, error => {
      console.error('Error al cargar asignaturas:', error);
    });
  }

  aumentarPorcentaje(index: number, tipo: string) {
    const maxPorcentaje = 1; // 100%

    if (tipo === 'asignaturas' && this.asignaturas[index].porcentaje < maxPorcentaje) {
      this.asignaturas[index].porcentaje += 0.1; // Aumenta en 10%
      if (this.asignaturas[index].porcentaje > maxPorcentaje) {
        this.asignaturas[index].porcentaje = maxPorcentaje; // Limitar al 100%
      }
    } else if (tipo === 'asignaturasAdicionales' && this.asignaturasAdicionales[index].porcentaje < maxPorcentaje) {
      this.asignaturasAdicionales[index].porcentaje += 0.1; // Aumenta en 10%
      if (this.asignaturasAdicionales[index].porcentaje > maxPorcentaje) {
        this.asignaturasAdicionales[index].porcentaje = maxPorcentaje; // Limitar al 100%
      }
    }
  }
  disminuirPorcentaje(index: number, tipo: string) {
    const minPorcentaje = 0; // 0%
  
    if (tipo === 'asignaturas' && this.asignaturas[index].porcentaje > minPorcentaje) {
      this.asignaturas[index].porcentaje -= 0.1; // Disminuye en 10%
      if (this.asignaturas[index].porcentaje < minPorcentaje) {
        this.asignaturas[index].porcentaje = minPorcentaje; // Limitar al 0%
      }
    } else if (tipo === 'asignaturasAdicionales' && this.asignaturasAdicionales[index].porcentaje > minPorcentaje) {
      this.asignaturasAdicionales[index].porcentaje -= 0.1; // Disminuye en 10%
      if (this.asignaturasAdicionales[index].porcentaje < minPorcentaje) {
        this.asignaturasAdicionales[index].porcentaje = minPorcentaje; // Limitar al 0%
      }
    }
  }
}







