import json
import os


def load_fixture(file_name, key=None):
    file_path = os.path.join(os.getcwd(), 'fixtures', f'{file_name}.json')
    with open(file_path) as f:
        data = json.load(f)
    if key is not None:
        if key not in data:
            raise KeyError(f'Fixture key "{key}" not found in fixtures/{file_name}.json')
        return data[key]
    return data
