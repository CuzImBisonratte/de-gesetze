# de-gesetze

This repository contains a converter for german laws. The laws are taken from the [Gesetze im Internet](https://www.gesetze-im-internet.de) dataset.
All Information about the dataset can be found [here](https://www.govdata.de/suche/daten/gesetze-im-internet). All information about the license can be found in the [license information file](https://raw.githubusercontent.com/CuzImBisonratte/de-gesetze/refs/heads/main/LICENSE.md).

It downloads the laws from the [Gesetze im Internet](https://www.gesetze-im-internet.de) dataset. After downloading the laws, it converts them to JSON and then to markdown.

The laws are stored in the `laws` directory in seperate `json`, `md` and `xml` directories and are named by their legal abbreviation (`jurabk`).

## Data format

### XML
The XML data format is the original format from the [Gesetze im Internet](https://www.gesetze-im-internet.de) dataset. It is only altered by extracting it from the bundles it comes in and then renamed to the legal abbreviation.

### JSON
The JSON data format is a conversion from the XML format. It is NOT directly converted from the XML format, but converted into a custom JSON format. The JSON format is as follows (examples used are `1-DM-GoldmünzG` and the `GG` (Grundgesetz)):

<details>
<summary>1-DM-GoldmünzG as JSON</summary>

```json
{
    "metadata": {
        "title": "Gesetz über die Ausprägung einer 1-DM-Goldmünze\nund die Errichtung der Stiftung \"Geld und Währung\"",
        "shortTitle": "1-DM-GoldmünzG",
        "date": "2000-12-27"
    },
    "law": [
        {
            "type": "section",
            "title": {
                "kennung": "§ 1",
                "title": "Ausgabe durch die Deutsche Bundesbank"
            },
            "content": [
                "Die Deutsche Bundesbank wird ermächtigt, zum Gedenken an die Deutsche Mark im eigenen Namen im Jahre 2001 eine Münze in Gold über 1 Deutsche Mark (1-DM-Goldmünze) mit einer Auflage von bis zu einer Million Stück herauszugeben."
            ]
        }
    ]
}
```
</details>
<details>
<summary>GG (Grundgesetz) as JSON</summary>

```json
{
    "metadata": {
        "title": "Grundgesetz für die Bundesrepublik Deutschland",
        "shortTitle": "GG",
        "date": "1949-05-23"
    },
    "law": [
        {
            "type": "section",
            "title": {
                "kennung": "Art 1",
                "title": ""
            },
            "content": [
                "(1) Die Würde des Menschen ist unantastbar. Sie zu achten und zu schützen ist Verpflichtung aller staatlichen Gewalt.",
                "(2) Das Deutsche Volk bekennt sich darum zu unverletzlichen und unveräußerlichen Menschenrechten als Grundlage jeder menschlichen Gemeinschaft, des Friedens und der Gerechtigkeit in der Welt.",
                "(3) Die nachfolgenden Grundrechte binden Gesetzgebung, vollziehende Gewalt und Rechtsprechung als unmittelbar geltendes Recht."
            ]
        }
    ]
}
```
</details>  


### Special cases

There are many different ways the laws are structured, so the JSON format is not always the same.
Here you can find the schema used after the conversion:

<details>
<summary>JSON Output Schema</summary>

You always have a `metadata` object with the following properties:
- `title`: The title of the law
- `shortTitle`: The short title of the law
- `date`: The date the law was last changed

The `law` object is an array of objects. Each object has the following properties:
- `title`: The title split into 
    - `enum`: The enumeration of the section
    - `title`: The title of the section
- `content`: An array of strings that contain the content of the section

The important part is how the `content` is structured. The `content` normally is just an array of strings.

- Sometimes (e.g. in [1-DM-GoldmünzG § 11](https://www.gesetze-im-internet.de/1-dm-goldm_nzg/__11.html)), there is a list in the content. In this case, the list is split into multiple strings, this can look as follows:
    ```json
    "content": [
        "(1) Zweck der Stiftung ist, das Bewusstsein der Öffentlichkeit für die Bedeutung stabilen Geldes zu erhalten und zu fördern. Die Stiftung unterstützt zu diesem Zweck die wirtschaftswissenschaftliche und juristische Forschung insbesondere auf dem Gebiet des Geld- und Währungswesens.",
        {
            "special": "list",
            "text": "(2) Der Erfüllung dieses Zwecks dienen insbesondere: ",
            "list": [
                "1. die Durchführung und Finanzierung von Forschungsprojekten;",
                "2. die Gewährung von Forschungsstipendien;",
                "3. die Förderung des wissenschaftlichen Meinungsaustauschs durch Veranstaltungen und Diskussionsforen mit deutscher und internationaler Beteiligung."
            ]
        }
    ]
    ```