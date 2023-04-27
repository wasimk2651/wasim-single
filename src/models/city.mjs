export default class City {
  id;
  name;
  countryCode;
  district;
  population;
  country;

  constructor(id, name, countryCode, district, population) {
    this.id = id;
    this.name = name;
    this.countryCode = countryCode;
    this.district = district;
    this.population = population;
  }

  get populationFormatted() {
    return this.population.toLocaleString();
  }

  get countryName() {
    return this.country ? this.country.name : null;
  }

  setCountry(country) {
    this.country = country;
  }

  static fromRow(row) {
    const [id, name, countryCode, district, population] = row;
    return new City(id, name, countryCode, district, population);
  }
}
