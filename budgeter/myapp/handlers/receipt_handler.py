import requests
from fuzzywuzzy import fuzz

class ReceiptHandler:
    def __init__(self, key):
        self.key = key
        self.api_url = "https://api.ocr.space/parse/image"
        self.subtotal_keywords = ["SUBTOTAL", "SUB TOTAL", "SUBTOTL", "SUBTOTALE"]
        self.total_keywords = ["TOTAL", "TOTALE", "TOTL", "TOT"]
        pass

    # assuming image represents the whole image file in format accepted by API
    def scan_receipt(self, image):
        payload = {'apikey': self.key, 
               'isOverlayRequired': 'true', 
               'language': 'eng'}

        response = requests.post(self.api_url, files={'file': image}, data=payload)
        return self.parse_ocr_output(response.json())

    # response is json format
    def parse_ocr_output(self, response):
        res = {}
        try:
            lines = response['ParsedResults'][0]['TextOverlay']['Lines']
            for line in lines:
                line_text = line['LineText']
                for w in line['Words']:
                    word = w['WordText']
                    top = w['Top']
                    if any(fuzz.ratio(word.upper(), keyword) >= 80 for keyword in self.subtotal_keywords) and res.get('Subtotal', -1) == -1:
                        value = self.find_value(top, lines)
                        res['Subtotal'] = value
                    elif any(fuzz.ratio(word.upper(), keyword) >= 80 for keyword in self.total_keywords) and res.get('Total', -1) == -1:
                        value = self.find_value(top, lines)
                        res['Total'] = value
                    elif self.is_item(line_text):
                        value = self.find_value(top, lines)
                        if value != -1.0:
                            res[line_text] = value
                            break
                if 'Subtotal' in res.keys() and 'Total' in res.keys():
                    break;
            return res
        except Exception as e:
            print(response)
            print(e)

    def find_value(self, top, lines):
        for line in lines:
            if abs(line['MinTop'] - top) > 2:
                continue 
            words = line['Words']
            for word in words:
                text = word['WordText']
                if self.is_money_value(text):
                    return float(text)
        return -1.0

    def is_item(self, text):
        text = text.strip()

        total_count = len(text)
        if total_count == 0:
            return False

        alphabetic_count = sum(1 for char in text if char.isalpha())

        return alphabetic_count > (1.0 / 4) * total_count
        

    def modify_receipt(self, details):
        pass
    
    def is_money_value(self, string):
        # Remove leading and trailing whitespace, $, and , signs
        string = string.strip().replace('$', '').replace(',', '')
    
        # Check if the string is empty after stripping
        if not string:
            return False
        
        # Split the string into integer and decimal parts
        parts = string.split('.')
        
        # Check if there's exactly one decimal point
        if len(parts) != 2:
            return False
        
        integer_part, decimal_part = parts
        
        # Check if the integer part is a valid number (allowing for a leading minus sign)
        if integer_part.startswith('-'):
            integer_part = integer_part[1:]
        if not integer_part.isdigit():
            return False
            
        # Check if the decimal part has exactly two digits
        if len(decimal_part) != 2 or not decimal_part.isdigit():
            return False
        
        # All checks passed
        return True
