# jekins-cli

## Installation
```bash
npm install jekins-cli -g
jekins init 
# edit the initialized config, update your jekins configurations.
```
## Usage
```bash
jekins build -b some-project
# -b beta
# -d development
# -p production

jekins stop -b some-project buildId
# -b beta
# -d development
# -p production
```